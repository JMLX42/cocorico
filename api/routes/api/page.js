var keystone = require('keystone');

var Page = keystone.list('Page');

/**
 * List Pages
 */
exports.list = function(req, res)
{
	Page.model.find()
        .where('published', true)
        .exec(function(err, items)
        {
    		if (err) return res.apiError('database error', err);

    		res.apiResponse({ pages: items });
    	});
}

/**
 * List navbar Pages
 */
exports.navbar = function(req, res)
{
	Page.model.find({
			published 		: true,
			showInNavBar 	: true
		})
		.sort('sortOrder')
        .exec(function(err, items)
        {
    		if (err) return res.apiError('database error', err);

    		res.apiResponse({ pages: items });
    	});
}

/**
 * Get Page by ID
 */
exports.get = function(req, res)
{
	Page.model.findById(req.params.id).exec(function(err, item)
    {
		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		res.apiResponse({ page : item });
	});
}

/**
 * Get Page by Slug
 */
exports.getBySlug = function(req, res)
{
	Page.model.findOne({slug : req.params.slug})
		.exec(function(err, item)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!item)
				return res.status(404).send();

			res.apiResponse({ page : item });
		});
}
