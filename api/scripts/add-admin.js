#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('keystone');
var argv = require('minimist')(process.argv.slice(2));

keystone.init({mongo: config.mongo.uri, headless: true});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../dist/models');

var Admin = keystone.list('Admin');

function addUser(email, password, isAdmin, username, done) {
  Admin.model.findOne({email:email})
    .exec((err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        var newAdmin = new Admin.model({
          email: email,
          name: username,
          password: password,
          isAdmin: isAdmin,
        });

        return newAdmin.save((saveErr) => {
          if (saveErr) {
            return done(saveErr);
          }

          console.log('Admin created.');
          return done(null, newAdmin);
        });
      } else {
        console.log('Admin already exists.');
        return done(null, user);
      }
    });
};

addUser(
  argv.email, argv.password, argv.isAdmin === 'true', argv.username,
  (err, admin) => {
    if (!!err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  }
);
