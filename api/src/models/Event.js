import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';
import './IPAddress'

const Types = keystone.Field.Types;
const IPAddress = keystone.list('IPAddress');

var Event = new keystone.List('Event', {
  defaultColumns: 'createdAt, ip, type, message',
  defaultSort: '-createdAt',
  track: { createdAt: true, updatedAt: true },
  nodelete: config.env !== 'development',
  nocreate: true,
  noedit: true,
});

Event.add({
  ip: { type: Types.Relationship, ref: 'IPAddress', required: false, initial: true },
  type: {
    type: Types.Select,
    options: [
      'emerg',
      'alert',
      'crit',
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

Event.logWarningEventAndBlacklist = async function(requestOrIP, message) {
  const address = await IPAddress.getIPAddress(requestOrIP);

  await Event.model({ip: address, type: 'warning', message: message}).save();

  address.numWarningsLeft -= 1;

  if (address.numWarningsLeft === 0) {
    await Event.model({ip: address, type: 'alert', message: 'no warning left, blacklisting IP'}).save();
    await address.blacklist();

    return true;
  }

  await address.save();

  return false;
}

transform.toJSON(Event);

Event.register();
