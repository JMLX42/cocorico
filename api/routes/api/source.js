var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source'),
    Like = keystone.list('Like'),
    Text = keystone.list('Text');

var TextHelper = require('../../helpers/TextHelper'),
    LikeHelper = require('../../helpers/LikeHelper');

exports.list = function(req, res)
{
    Text.model.findById(req.params.textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).apiResponse();

            if (!TextHelper.textIsReadable(text, req))
    			return res.status(403).send();

            Source.model.find({text : text})
                .populate('likes')
                .sort('-score')
                .exec(function(err, sources)
                {
                    if (err)
                        return res.apiError('database error', err);

                    for (var source of sources)
                        source.likes = LikeHelper.filterUserLikes(source.likes, req.user);

                    res.apiResponse({ sources : sources });
                });
        });
}

exports.addLike = function(req, res)
{
    LikeHelper.addLike(
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
    LikeHelper.removeLike(
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
    Text.model.findById(req.body.textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).apiResponse();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'review')
    			return res.status(403).send();

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
                                text: text
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
        });
}
