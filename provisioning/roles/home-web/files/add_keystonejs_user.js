require('dotenv').load();

var keystone = require("keystone");
var User = keystone.list("User");

module.exports = function(userEmail, userPassword, userIsAdmin, done)
{
    User.model.find()
        .where('email', userEmail)
        .exec(function(err, users)
        {
            if (users.length == 0)
            {
                var newUser = new User.model({
                	email: userEmail,
                    name: {'first' : 'test', 'last' : 'test' },
                	password: userPassword,
                	isAdmin: userIsAdmin == 'true'
                });

                newUser.save(function(err)
                {
                    console.log(err);
                });

                console.log('User created.');
                console.log(newUser);
            }
            else
            {
                console.log('User already exists.');
            }

            done();
        });
};
