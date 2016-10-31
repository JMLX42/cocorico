#!/bin/sh
':' //# http://sambal.org/?p=1014; exec /usr/bin/env node --require babel-polyfill /usr/lib/node_modules/headstone/cli.js $0 $@

var keystone = require('keystone');
var App = keystone.list('App');

module.exports = function(title, secret, url, done) {
  App.model.findOne({title: title})
    .exec((err, app) => {
      if (!app) {
        var newApp = new App.model({
          title: title,
          secret: secret,
          validURLs: [url],
        });

        return newApp.save((saveErr, savedApp) => {
          if (saveErr) {
            console.log(saveErr);
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
