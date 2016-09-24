var config = require('../../config.json');

var keystone = require('keystone');
var metafetch = require('metafetch');

var Source = keystone.list('Source'),
  Vote = keystone.list('Vote');

var LikeHelper = require('../../helpers/LikeHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Source, 'ERROR_SOURCE_NOT_FOUND', 'ERROR_SOURCE_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Source);

exports.list = function(req, res) {
  if (!config.capabilities.source.read)
    return res.status(403).send();

  return Vote.model.findById(req.params.voteId)
    .exec((findErr, vote) => {
      if (findErr)
        return res.apiError('database error', findErr);

      if (!vote)
        return res.status(404).apiResponse();

      return Source.model.find({vote : vote})
        .populate('likes')
        .sort('-score')
        .exec((err, sources) => {
          if (err)
            return res.apiError('database error', err);

          for (var source of sources)
            source.likes = LikeHelper.filterUserLikes(source.likes, req.user);

          return res.apiResponse({ sources : sources });
        });
    });
}

exports.add = function(req, res) {
  if (!config.capabilities.source.create)
    return res.status(403).send();

  return Vote.model.findById(req.body.voteId)
    .exec((err, vote) => {
      if (err)
        return res.apiError('database error', err);

      if (!vote)
        return res.status(404).apiResponse();

      return Source.model.findOne({url: req.body.url, vote: vote})
        .exec((findSourceErr, source) => {
          if (findSourceErr)
            return res.apiError('database error', findSourceErr);

          if (source)
            return res.status(400).apiResponse({
              error: 'ERROR_SOURCE_ALREADY_EXISTS',
            });

          return metafetch.fetch(
            decodeURIComponent(req.body.url),
            {
              flags: { images: false, links: false },
              http: { timeout: 30000 },
            },
            (fetchErr, meta) => {
              if (fetchErr)
                return res.apiError('invalid source URL');

              var newSource = Source.model({
                title: meta.title,
                url: meta.url,
                vote: vote.id,
                description: meta.description,
                image: meta.image,
                type: meta.type,
              });

              return newSource.save((saveErr) => {
                if (saveErr)
                  return res.apiError('database error', saveErr);

                return res.apiResponse({ source: newSource });
              });
            }
          );
        });
    });
}
