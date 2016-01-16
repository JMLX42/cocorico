var config = require('/opt/cocorico/cocorico.json');
var keystone = require('keystone');
var User = keystone.list('User');

module.exports = function(userEmail, userPassword, userIsAdmin, userName, done)
{
    User.model.find()
        .where('email', userEmail)
        .exec(function(err, users)
        {
            if (users.length == 0)
            {
                var newUser = new User.model({
                	email: userEmail,
                  name: userName,
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
