var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source'),
    Like = keystone.list('Like');

exports.list = function(req, res)
{
    Source.model.find({text : req.params.textId})
        .populate('likes')
        .sort('-score')
        .exec(function(err, sources)
        {
            if (err)
                return res.apiError('database error', err);

            for (var source of sources)
            {
                var likes = source.likes;

                source.likes = [];
                if (req.user && req.user.sub)
                    for (var like of likes)
                        if (bcrypt.compareSync(req.user.sub, like.author))
                        {
                            source.likes = [like];
                            break;
                        }
            }

            res.apiResponse({ sources : sources });
        });
}

exports.addLike = function(req, res)
{
    Like.addLike(
        Source.model, req.params.id, req.user, req.params.value == 'true',
        function(err, resource, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!resource)
                return res.status(404).apiResponse({
                    error: 'error.ERROR_SOURCE_NOT_FOUND'
                });

            if (like)
                return res.status(400).apiResponse({
                    error: 'error.ERROR_SOURCE_ALREADY_LIKED'
                });
        },
        function(resource, like)
        {
            return res.apiResponse({ like : like });
        }
    );
}

exports.removeLike = function(req, res)
{
    Like.removeLike(
        Source.model, req.params.id, req.user,
        function(err, resource, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!resource || !authorLike)
                return res.status(404).apiResponse();
        },
        function(resource, like)
        {
            res.apiResponse({ like : like });
        }
    );
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
