var keystone = require('keystone');

var User = keystone.list('User');

/**
 * Returns the currently logged in user.
 */
exports.me = function(req, res)
{
    if (!req.isAuthenticated())
        res.status(404).apiResponse({ 'error': 'not logged in' });
    else
        res.apiResponse({ 'user': req.user });
}
