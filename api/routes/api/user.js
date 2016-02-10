var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');

var User = keystone.list('User'),
    Bill = keystone.list('Bill');

/**
 * Returns the currently logged in user.
 */
exports.me = function(req, res)
{
    res.apiResponse({ 'user': req.user });
}

exports.bills = function(req, res)
{
	Bill.model.find()
        .sort('-publishedAt')
		.exec(function(err, bills)
		{
			if (err)
				return res.apiError('database error', err);

			var userBills = [];
			if (bills && bills.length != 0)
				for (var bill of bills)
					if (bill.author && bcrypt.compareSync(req.user.sub, bill.author))
                        userBills.push(bill);

            return res.apiResponse({ bills: userBills });
		});
}
