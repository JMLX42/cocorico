var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source'),
    Like = keystone.list('Like'),
    Bill = keystone.list('Bill');

var BillHelper = require('../../helpers/BillHelper'),
    LikeHelper = require('../../helpers/LikeHelper'),
    SourceHelper = require('../../helpers/SourceHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Source, 'ERROR_SOURCE_NOT_FOUND', 'ERROR_SOURCE_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Source);

exports.list = function(req, res)
{
    Bill.model.findById(req.params.billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).apiResponse();

            if (!BillHelper.billIsReadable(bill, req))
    			return res.status(403).send();

            Source.model.find({bill : bill})
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
    Bill.model.findById(req.body.billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).apiResponse();

            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'review')
    			return res.status(403).send();

            Source.model.findOne({url: req.body.url})
                .exec(function(err, source)
                {
                    if (err)
                        return res.apiError('database error', err);

                    if (source)
                        return res.status(400).apiResponse({
                            error: 'ERROR_SOURCE_ALREADY_EXISTS'
                        });

                    SourceHelper.fetchPageTitle(
                        decodeURIComponent(req.body.url),
                        function(error, result)
                        {
                            console.log(error, result);

                            var newSource = Source.model({
                                title: error ? '' : result,
                                url: req.body.url,
                                author: bcrypt.hashSync(req.user.sub, 10),
                                bill: bill
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
