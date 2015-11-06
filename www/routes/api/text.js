var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');

var Text = keystone.list('Text');
var Ballot = keystone.list('Ballot');

function textIsReadable(text, req, checkAuthor)
{
	return ['draft'].indexOf(text.status) < 0
		|| (!checkAuthor && req.isAuthenticated() && bcrypt.compareSync(req.user.sub, text.author));
}

function filterReadableTexts(texts, req, checkAuthor)
{
	var filtered = [];

	for (var text of texts)
		if (textIsReadable(text, req, checkAuthor))
			filtered.push(text);

	return filtered;
}

/**
 * List Texts
 */
exports.list = function(req, res)
{
	Text.model.find()
		.exec(function(err, texts)
	    {
			if (err)
				return res.apiError('database error', err);

			res.apiResponse({ texts: filterReadableTexts(texts, req, true) });
		});
}

/**
 * Get Text by ID
 */
exports.get = function(req, res)
{
	Text.model.findById(req.params.id).exec(function(err, text)
    {
		if (err)
			return res.apiError('database error', err);
		if (!text)
			return res.apiError('not found');

		if (!textIsReadable(text, req))
			return res.status(403).send();

		res.apiResponse({ text: text });
	});
}

exports.latest = function(req, res)
{
	Text.model.find()
		.sort('-publishedAt')
		.limit(10)
		.exec(function(err, texts)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!texts)
				return res.apiError('not found');

			res.apiResponse({ texts: filterReadableTexts(texts, req, true) });
		});
}

exports.getBallot = function(req, res)
{
	Ballot.getByTextIdAndVoter(
		req.params.id,
		req.user.sub,
		function(err, ballot)
		{
			if (err)
				return res.apiError('database error', err);

			if (!ballot)
				return res.status(404).apiResponse({
					error: 'ballot does not exist'
				});

			return res.apiResponse({ ballot: ballot });
		}
	);
}

function vote(req, res, value)
{
	Text.model.findById(req.params.id).exec(function(err, text)
	{
		if (err)
			return res.apiError('database error', err);
		if (!text)
			return res.apiError('not found');

		if (!textIsReadable(text, req))
			return res.status(403).send();

		Ballot.getByTextIdAndVoter(
			req.params.id,
			req.user.sub,
			function(err, ballot)
			{
				if (err)
					return res.apiError('database error', err);

				if (ballot)
					return res.status(403).apiResponse({
						error: 'user already voted'
					});

				ballot = Ballot.model({
					text: text,
					voter: bcrypt.hashSync(req.user.sub, 10),
					value: value
				});

				ballot.save(function(err)
				{
					if (err)
						return res.apiError('database error', err);

					res.apiResponse({ ballot: ballot });
				});
			}
		);
	});
}

exports.voteYes = function(req, res)
{
	vote(req, res, 'yes');
}

exports.voteBlank = function(req, res)
{
	vote(req, res, 'blank');
}

exports.voteNo = function(req, res)
{
	vote(req, res, 'no');
}

exports.unvote = function(req, res)
{
	Text.model.findById(req.params.id).exec(function(err, text)
	{
		if (err)
			return res.apiError('database error', err);
		if (!text)
			return res.apiError('not found');

		if (!textIsReadable(text, req))
			return res.status(403).send();

		Ballot.getByTextIdAndVoter(
			req.params.id,
			req.user.sub,
			function(err, ballot)
			{
				if (err)
					return res.apiError('database error', err);

				if (!ballot)
					return res.status(404).apiResponse({
						error: 'ballot does not exist'
					});

				Ballot.model.findById(ballot.id).remove(function(err)
				{
					var client = redis.createClient();
					var key = 'ballot/' + req.params.id + '/' + req.user.sub;

					if (err)
						return res.apiError('database error', err);

					client.on('connect', function()
					{
						client.del(key, function(err, reply)
						{
							if (err)
								console.log(err);

							return res.apiResponse({ ballot: 'removed' });
						});
					});
				});
			});
	});
}

/**
 * Get Text by slug
 */
exports.getBySlug = function(req, res)
{
	Text.model.findOne()
		.where('slug', req.params.slug)
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!text)
				return res.status(404).send();
			if (!textIsReadable(text, req))
				return res.status(403).send();

			res.apiResponse({ text: text });
		});
}

exports.save = function(req, res)
{
	if (!req.body.title)
		return res.status(400).apiResponse({ error : 'missing title' });

	if (!req.body.content)
		return res.status(400).apiResponse({ error : 'missing content' });

	var newText = Text.model({
		title: req.body.title,
		content: { md: req.body.content }
	});

	Text.model.findOne(req.body.id ? {_id : req.body.id} : {slug: newText.slug})
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (text && !textIsReadable(text, req))
				return res.status(403).send();

			if (!text)
			{
				newText.author = bcrypt.hashSync(req.user.sub, 10);
				newText.save(function(err, text)
				{
					if (err)
						return res.apiError('database error', err);

					return res.apiResponse({
						action: 'create',
						text : newText
					})
				});
			}
			else
			{
				if (bcrypt.compareSync(req.user.sub, text.author))
				{
					text.title = newText.title;
					text.content.md = newText.content.md;
					text.save(function(err, text)
					{
						if (err)
							return res.apiError('database error', err);

						return res.apiResponse({
							action: 'update',
							text : text
						});
					});
				}
				else
					return res.status(403).send();
			}
		});
}

// exports.delete = function(req, res)
// {
// 	Text.model.findById(req.params.id).remove(function(err)
// 	{
// 		if (err)
// 			return res.apiError('database error', err);
//
// 		return res.apiResponse({action: 'deleted'});
// 	});
// }

exports.status = function(req, res)
{
	Text.model.findOne({_id : req.params.id})
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!text)
				return res.status(404).send();
			if (!bcrypt.compareSync(req.user.sub, text.author))
				return res.status(403).send();

			text.status = req.params.status;
			text.save(function(err)
			{
				if (err)
					return res.apiError('database error', err);

				return res.apiResponse({
					action: 'update',
					text : text
				});
			});
		});
}
