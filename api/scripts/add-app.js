#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill $0 $@

var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('keystone');
var argv = require('minimist')(process.argv.slice(2));

keystone.init({mongo: config.mongo.uri, headless: true});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../dist/models');

var App = keystone.list('App');

function addApp(title, secret, url, done) {
  App.model.findOne({title: title})
    .exec((err, app) => {
      if (err) {
        return done(err);
      }

      if (!app) {
        var newApp = new App.model({
          title: title,
          secret: secret,
          validURLs: [url],
        });

        return newApp.save((saveErr, savedApp) => {
          if (saveErr) {
            return done(saveErr);
          }

          console.log('App created with ID ' + savedApp.id + '.');
          return done();
        });
      } else {
        console.log('App already exists with ID ' + app.id + '.');
        return done();
      }
    });
};

addApp(
  argv.title, argv.secret, argv.url,
  (err, app) => {
    if (!!err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  }
);
