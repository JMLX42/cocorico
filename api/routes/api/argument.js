var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Argument = keystone.list('Argument'),
    Text = keystone.list('Text'),
    Like = keystone.list('Like');

var TextHelper = require('../../helpers/TextHelper'),
    LikeHelper = require('../../helpers/LikeHelper');

exports.list = function(req, res)
{
    Text.model.findOne(req.params.textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            if (!TextHelper.textIsReadable(text, req))
                return res.status(403).send();

            Argument.model.find({text : text})
                .populate('likes')
                .exec(function(err, arguments)
                {
                    if (err)
                        return res.apiError('database error', err);

                    for (var argument of arguments)
                        argument.likes = LikeHelper.filterUserLikes(argument.likes, req.user);

                    return res.apiResponse({arguments : arguments});
                });
        });
}

exports.add = function(req, res)
{
    var textId = req.body.textId;
    var title = req.body.title;
    var content = req.body.content;
    var value = req.body.value;

    Text.model.findOne(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).apiResponse();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'debate')
    			return res.status(403).send();

    		var newArgument = Argument.model({
    			title   : title,
                content : content,
    			text    : text,
                value   : value,
                author  : bcrypt.hashSync(req.user.sub, 10)
    		});

    		newArgument.save(function(err)
    		{
    			if (err)
    				return res.apiError('database error', err);

    			res.apiResponse({ argument : newArgument });
    		});
        });
}

exports.remove = function(req, res)
{

}

exports.addLike = function(req, res)
{
    LikeHelper.addLike(
        Argument.model, req.params.id, req.user, req.params.value == 'true',
        function(err, argument, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!argument)
                return res.status(404).apiResponse({
                    error: 'ERROR_ARGUMENT_NOT_FOUND'
                });

            if (like)
                return res.status(400).apiResponse({
                    error: 'ERROR_ARGUMENT_ALREADY_LIKED'
                });
        },
        function(argument, like)
        {
            return res.apiResponse({ like : like });
        }
    );
}

exports.removeLike = function(req, res)
{
    LikeHelper.removeLike(
        Argument.model, req.params.id, req.user,
        function(err, argument, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!argument || !authorLike)
                return res.status(404).apiResponse();
        },
        function(argument, like)
        {
            res.apiResponse({ like : like });
        }
    );
}
