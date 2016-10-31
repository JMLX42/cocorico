#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('keystone');
var fs = require('fs');
var async = require('async');
var argv = require('minimist')(process.argv.slice(2));

keystone.init({mongo: config.mongo.uri, headless: true});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../dist/models');

var IPAddress = keystone.list('IPAddress');

var ips = fs.readFileSync(argv.file).toString().split('\n').filter(e=>!!e);

async.waterfall(
  ips.map((ip) => (callback) => {
    IPAddress.model.findOne({ip:ip}).exec((err, address) => {
      if (!!err) {
        callback(err);
      }

      if (!address) {
        address = IPAddress.model({ip:ip});
      }

      address.blacklisted = true;
      address.save((err2) => {
        if (!!err2) {
          callback(err2);
        }
        console.log('blacklisted IP ' + ip);
        callback(null);
      });

    });
  }),
  (err) => {
    process.exit(!!err ? 1 : 0);
  }
);
