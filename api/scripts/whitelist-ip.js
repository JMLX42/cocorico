#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('keystone');
var argv = require('minimist')(process.argv.slice(2));

keystone.init({mongo: config.mongo.uri, headless: true});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../dist/models');

var IPAddress = keystone.list('IPAddress');

function whitelistIP(ip, callback) {
  IPAddress.model.findOne({ip:ip}).exec((err, address) => {
    if (!!err) {
      callback(err);
      return;
    }

    if (!address) {
      address = IPAddress.model({ip:ip});
    }

    if (address.whitelisted) {
      console.log('IP ' + argv.ip + ' already whitelisted');
      callback(null, address);
    }

    address.whitelisted = true;

    address.save((saveErr) => {
      if (!!saveErr) {
        callback(saveErr);
        return;
      }

      console.log('IP ' + argv.ip + ' whitelisted');
      callback(saveErr, address);
    });
  });
}

whitelistIP(argv.ip, (err) => {
  if (!!err) {
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
});
