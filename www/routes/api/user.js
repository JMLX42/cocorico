var keystone = require('keystone');

var User = keystone.list('User');

/**
 * Returns the currently logged in user.
 */
exports.me = function(req, res)
{
    res.apiResponse({ 'user': req.user });
}
