var keystone = require('keystone');

/**
 * Returns the currently logged in user.
 */
exports.me = function(req, res)
{
    res.apiResponse({ 'user': {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        birthdate: req.user.birthdate
    }});
}
