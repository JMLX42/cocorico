import childProcess from 'child_process';
import keystone from 'keystone';
import transform from 'model-transform';

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

function isInIptables(ip) {
  var iptables = childProcess.execSync('iptables -L -n -w');

  return iptables.indexOf('DROP       all  --  ' + ip) >= 0;
}

function addToIptables(ip) {
  if (isInIptables(ip)) {
    return false;
  }

  childProcess.execSync(
    'iptables -I INPUT 1 -s "' + ip + '" -j DROP -w',
    {stdio:'ignore'}
  );

  return true;
}

function removeFromIpTables(ip) {
  if (!isInIptables(ip)) {
    return false;
  }

  while (isInIptables(ip)) {
    childProcess.execSync(
      'iptables -D INPUT -s "' + ip + '" -j DROP -w',
      {stdio:'ignore'}
    );
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
    address = await IPAddress.model({ip: ip, blacklisted: false}).save();
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
    for (var address of addresses) {
      if (address.blacklisted) {
        addToIptables(address.ip);
      } else {
        removeFromIpTables(address.ip);
      }
    }
  });
}
