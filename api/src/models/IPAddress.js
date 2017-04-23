import childProcess from 'child_process';
import keystone from 'keystone';
import transform from 'model-transform';
import promise from 'thenify';
import {iptables} from 'netfilter';

import logger from '../logger';

const Types = keystone.Field.Types;

const MAX_NUM_WARNINGS = 50;

const IPAddress = new keystone.List('IPAddress', {
  singular: 'IP Address',
  defaultSort: '-updatedAt',
  map: { name: 'ip' },
  track: { createdAt: true, updatedAt: true },
  defaultColumns: 'ip, blacklisted|10%, whitelisted|10%, numWarningsLeft|15%, updatedAt, description',
});

IPAddress.add({
  ip: {
    type: Types.Text,
    required: true,
    initial: true,
    unique: true,
    noedit: true,
    index: true,
  },
  blacklisted: { type: Types.Boolean, dependsOn: { whitelisted: false } },
  whitelisted: { type: Types.Boolean },
  numWarningsLeft: {
    type: Types.Number,
    default: MAX_NUM_WARNINGS,
    dependsOn: {
      whitelisted: false,
      blacklisted: false,
    },
  },
  description: { type: Types.Textarea },
});

IPAddress.relationship({ path: 'events', ref: 'Event', refPath: 'ip' });

function getIpTableRule(ip) {
  return {
    table:    'filter',
    chain:    'INPUT',
    source:   ip,
    jump:     'DROP'
  };
}

async function isInIptables(ip) {
  try {
    await promise(iptables.check)(getIpTableRule(ip));
  } catch (e) {
    return false;
  }

  return true;
}

async function addToIptables(ip) {
  var exists = await isInIptables(ip);
  if (exists) {
    return false;
  }

  try {
    await promise(iptables.insert)(getIpTableRule(ip));
  } catch (e) {
    logger.error(e);
    return false;
  }

  return true;
}

async function removeFromIpTables(ip) {
  var exists = await isInIptables(ip);
  if (!exists) {
    return false;
  }

  try {
    await promise(iptables.delete)(getIpTableRule(ip));
  } catch (e) {
    logger.error(e);
    return false;
  }

  return true;
}

IPAddress.schema.pre('save', function(next) {
  this.wasNew = this.isNew;
  this.blacklistedWasModified = this.isModified('blacklisted');
  this.whitelistedWasModified = this.isModified('whitelisted');

  if (this.blacklistedWasModified && !this.blacklisted
      && this.numWarningsLeft <= 0) {
    this.numWarningsLeft = MAX_NUM_WARNINGS;
  }

  next();
});

IPAddress.schema.pre('validate', function(next) {
  if (this.whitelisted) {
    this.blacklisted = false;
  }

  if (this.numWarningsLeft < 0) {
    this.numWarningsLeft = 0;
  }

  next();
});

IPAddress.schema.post('save', function() {
  if (this.wasNew || this.blacklistedWasModified) {
    if (this.blacklisted) {
      addToIptables(this.ip);
    } else {
      removeFromIpTables(this.ip);
    }
  }
});

IPAddress.schema.post('remove', function(removed) {
  removeFromIpTables(removed.ip);
});

IPAddress.getIPAddress = async function(requestOrIP) {
  const ip = typeof requestOrIP === 'object'
    ? requestOrIP.headers['x-forwarded-for']
    : requestOrIP;

  var address = await IPAddress.model.findOne({ip:ip}).exec();

  if (!address) {
    try {
        address = await IPAddress.model({ip: ip, blacklisted: false}).save();
    } catch (e) {
        // In some rare occasions, concurrency will make findOne return nothing but then trying to create
        // a new model will fail because another process already created an IPAdresse with the same 'ip'.
        // We assume that's what happen if there is an error, and we call findOne again.
        address = await IPAddress.model.findOne({ip:ip}).exec();
    }
  }

  return address;
}

IPAddress.schema.methods.blacklist = async function() {
  this.blacklisted = true;

  return await this.save();
}

transform.toJSON(IPAddress);

IPAddress.register();

IPAddress.syncWithIPTables = function() {
  IPAddress.model.find().exec((err, addresses) => {
      logger.info('start syncing iptables', {'num_ips': addresses.length});
      var blacklisted = 0;
      for (var address of addresses) {
        if (address.blacklisted) {
          blacklisted++;
          addToIptables(address.ip);
        } else {
          removeFromIpTables(address.ip);
        }
      }
      logger.info(
        'finished syncing iptables',
        {'num_ips': addresses.length, 'num_blacklisted': blacklisted}
      );
  });
}
