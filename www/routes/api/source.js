var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source');

exports.list = function(req, res)
{
    Source.model.find({text : req.params.textId})
        .exec(function(err, sources)
        {
            if (err)
                return res.apiError('database error', err);

            res.apiResponse({ sources: sources });
        });
}

exports.like = function(req, res)
{
    
}

exports.add = function(req, res)
{
    Source.model.findOne({url: req.body.url})
        .exec(function(err, source)
        {
            if (err)
                return res.apiError('database error', err);

            if (source)
                return res.status(400).apiResponse({
                    error: 'error.ERROR_SOURCE_ALREADY_EXISTS'
                });

        	Source.fetchPageTitle(
                decodeURIComponent(req.body.url),
                function(error, result)
            	{
            		var newSource = Source.model({
            			title: error ? '' : result.title,
            			url: req.body.url,
            			author: bcrypt.hashSync(req.user.sub, 10),
            			text: req.body.textId
            		});

            		newSource.save(function(err)
            		{
            			if (err)
            				return res.apiError('database error', err);

            			res.apiResponse({ source: newSource });
            		});
            	}
            );
        });
}
