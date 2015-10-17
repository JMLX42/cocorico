require('dotenv').load();

var keystone = require("keystone");
var User = keystone.list("User");

module.exports = function(userEmail, userPassword, userIsAdmin, userFirstname, userLastname, done)
{
    User.model.find()
        .where('email', userEmail)
        .exec(function(err, users)
        {
            if (users.length == 0)
            {
                var newUser = new User.model({
                	email: userEmail,
                    name: {'first' : userFirstname, 'last' : userLastname },
                	password: userPassword,
                	isAdmin: userIsAdmin == 'true'
                });

                newUser.save(function(err)
                {
                    if (err)
                    {
                      console.log(err);
                      return done(err);
                    }

                    console.log('User created.');
                    done();
                });
            }
            else
            {
                console.log('User already exists.');
                done();
            }
        });
};
