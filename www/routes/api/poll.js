var keystone = require('keystone');

var Poll = keystone.list('Poll');

/**
 * List Polls
 */
exports.list = function(req, res)
{
	Poll.model.find(function(err, items)
    {
		if (err) return res.apiError('database error', err);

		res.apiResponse({
			polls: items
		});
	});
}

/**
 * Get Poll by ID
 */
exports.get = function(req, res)
{
	Poll.model.findById(req.params.id).exec(function(err, item)
    {
		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		res.apiResponse({
			poll: item
		});
	});
}

exports.latest = function(req, res)
{
	Poll.model.find()
		.sort('-publishedAt')
		.limit(1)
		.exec(function(err, item)
	    {
			if (err) return res.apiError('database error', err);
			if (!item) return res.apiError('not found');

			res.apiResponse({
				poll: item[0]
			});
		});
}
