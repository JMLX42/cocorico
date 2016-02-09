var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Argument = keystone.list('Argument'),
    Text = keystone.list('Text'),
    Like = keystone.list('Like');

var TextHelper = require('../../helpers/TextHelper'),
    LikeHelper = require('../../helpers/LikeHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Argument, 'ERROR_ARGUMENT_NOT_FOUND', 'ERROR_ARGUMENT_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Argument);

exports.list = function(req, res)
{
    Text.model.findById(req.params.textId)
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

    Text.model.findById(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).apiResponse();
            console.log(text);
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
