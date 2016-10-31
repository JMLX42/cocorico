import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';
import './IPAddress'

const Types = keystone.Field.Types;
const IPAddress = keystone.list('IPAddress');

const MAX_NUM_WARNINGS = 50;

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

Event.logWarningEventAndBlacklist = async function(requestOrIP, message) {
  const address = await IPAddress.getIPAddress(requestOrIP);

  await Event.model({ip: address, type: 'warning', message: message}).save();

  const events = await await Event.model.find({ip:address}).exec();
  const warnings = events.filter(e => e.type === 'warning');

  if (warnings.length > MAX_NUM_WARNINGS) {
    await Event.model({ip: address, type: 'alert', message: 'too many warnings, blacklisting IP'}).save();
    await address.blacklist();

    return true;
  }

  return false;
}

transform.toJSON(Event);

Event.register();
