import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';
import './IPAddress'

const Types = keystone.Field.Types;
const IPAddress = keystone.list('IPAddress');

var Event = new keystone.List('Event', {
  defaultColumns: 'createdAt, ip, type, message',
  defaultSort: '-createdAt',
  track: { createdAt: true, createdBy: true },
  nodelete: config.env !== 'development',
  nocreate: true,
  noedit: true,
});

Event.add({
  ip: { type: Types.Relationship, ref: 'IPAddress', required: false, initial: true },
  type: {
    type: Types.Select,
    options: [
      'emergency',
      'alert',
      'critical',
      'error',
      'warning',
      'notice',
      'info',
      'debug',
    ],
    default: 'info',
    required: true,
    initial: true,
  },
  message: { type: Types.Textarea, required: true, initial: true },
});

IPAddress.schema.post('remove', async function(removed) {
  await Event.model.find({ip:removed}).remove().exec();
});

IPAddress.schema.post('save', async function() {
  if (this.wasNew)
    return;

  if (this.blacklistedWasModified) {
    if (this.blacklisted && this.numWarningsLeft > 0) {
      await Event.model({ip: this, type: 'notice', message: 'IP blacklisted'}).save();
    }
    if (!this.blacklisted) {
      await Event.model({ip: this, type: 'notice', message: 'IP removed from blacklist'}).save();
    }
  }

  if (this.whitelistedWasModified) {
    if (this.whitelisted) {
      await Event.model({ip: this, type: 'notice', message: 'IP whitelisted'}).save();
    } else {
      await Event.model({ip: this, type: 'notice', message: 'IP removed from whitelist'}).save();
    }
  }
});

Event.logWarningEventAndBlacklist = async function(requestOrIP, message) {
  const address = await IPAddress.getIPAddress(requestOrIP);

  // The client might have pushed multiple requests at the same time.
  // One of the earlier requests might have set the IP as blacklisted but the
  // later requests were already through before iptables was updated.
  // Thus, we can get "ghosts" requests from a blacklisted IP.
  // Here, we chose to simply ignore them to avoid making the event logs look
  // like the previous blacklist attempt did not work.
  if (address.blacklisted) {
    await Event.model({ip: address, type: 'notice', message: 'extra warning on an already blacklisted IP'}).save();
    return true;
  }

  await Event.model({ip: address, type: 'warning', message: message}).save();

  address.numWarningsLeft -= 1;

  if (address.numWarningsLeft <= 0) {
    await Event.model({ip: address, type: 'alert', message: 'no warning left, blacklisting IP'}).save();
    await address.blacklist();

    return true;
  }

  await address.save();

  return false;
}

transform.toJSON(Event);

Event.register();
