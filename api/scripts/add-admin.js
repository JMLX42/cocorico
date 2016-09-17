var config = require('../config.json');
var keystone = require('keystone');
var Admin = keystone.list('Admin');

module.exports = function(userEmail, userPassword, userIsAdmin, userName, done)
{
    Admin.model.find()
        .where('email', userEmail)
        .exec(function(err, users)
        {
            if (users.length == 0)
            {
                var newAdmin = new Admin.model({
                	email: userEmail,
                    name: userName,
                	password: userPassword,
                	isAdmin: userIsAdmin == 'true'
                });

                newAdmin.save(function(err)
                {
                    if (err)
                    {
                      console.log(err);
                      return done(err);
                    }

                    console.log('Admin created.');
                    done();
                });
            }
            else
            {
                console.log('Admin already exists.');
                done();
            }
        });
};
