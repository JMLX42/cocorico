var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var metafetch = require('metafetch');

var Source = keystone.list('Source'),
    Like = keystone.list('Like'),
    Vote = keystone.list('Vote');

var LikeHelper = require('../../helpers/LikeHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Source, 'ERROR_SOURCE_NOT_FOUND', 'ERROR_SOURCE_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Source);

exports.list = function(req, res)
{
    if (!config.capabilities.source.read)
        return res.status(403).send();

    Vote.model.findById(req.params.voteId)
        .exec(function(err, vote)
        {
            if (err)
                return res.apiError('database error', err);

            if (!vote)
                return res.status(404).apiResponse();

            Source.model.find({vote : vote})
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

exports.add = function(req, res)
{
    if (!config.capabilities.source.create)
        return res.status(403).send();

    Vote.model.findById(req.body.voteId)
        .exec(function(err, vote)
        {
            if (err)
                return res.apiError('database error', err);

            if (!vote)
                return res.status(404).apiResponse();

            Source.model.findOne({url: req.body.url, vote: vote})
                .exec(function(err, source)
                {
                    if (err)
                        return res.apiError('database error', err);

                    if (source)
                        return res.status(400).apiResponse({
                            error: 'ERROR_SOURCE_ALREADY_EXISTS'
                        });

                    metafetch.fetch(
                        decodeURIComponent(req.body.url),
                        {
                            flags: { images: false, links: false },
                            http: { timeout: 30000 }
                        },
                        (err, meta) => {
                            if (err)
                                return res.apiError('invalid source URL');

                            var newSource = Source.model({
                                title: meta.title,
                                url: meta.url,
                                vote: vote.id,
                                description: meta.description,
                                image: meta.image,
                                type: meta.type
                            });

                            newSource.save((err) => {
                                if (err)
                                    return res.apiError('database error', err);

                                res.apiResponse({ source: newSource });
                            });
                        }
                    );
                });
        });
}
