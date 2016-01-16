var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');

var User = keystone.list('User'),
    Text = keystone.list('Text');

/**
 * Returns the currently logged in user.
 */
exports.me = function(req, res)
{
    res.apiResponse({ 'user': req.user });
}

exports.texts = function(req, res)
{
	Text.model.find()
        .sort('-publishedAt')
		.exec(function(err, texts)
		{
			if (err)
				return res.apiError('database error', err);

			var userTexts = [];
			if (texts && texts.length != 0)
				for (var text of texts)
					if (text.author && bcrypt.compareSync(req.user.sub, text.author))
                        userTexts.push(text);

            return res.apiResponse({ texts: userTexts });
		});
}
