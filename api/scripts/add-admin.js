#!/usr/bin/env headstone

var keystone = require('keystone');
var Admin = keystone.list('Admin');

module.exports = function(userEmail, userPassword, userIsAdmin, userName, done) {
  Admin.model.find()
    .where('email', userEmail)
    .exec((err, users) => {
      if (users.length === 0) {
        var newAdmin = new Admin.model({
          email: userEmail,
          name: userName,
          password: userPassword,
          isAdmin: userIsAdmin === 'true',
        });

        return newAdmin.save((saveErr) => {
          if (saveErr) {
            console.log(saveErr);
            return done(saveErr);
          }

          console.log('Admin created.');
          return done();
        });
      } else {
        console.log('Admin already exists.');
        return done();
      }
    });
};
