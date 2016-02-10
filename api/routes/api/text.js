var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var async = require('async');
var markdown = require('markdown').markdown;

var Text = keystone.list('Text'),
	Ballot = keystone.list('Ballot'),
	Source = keystone.list('Source'),
	Like = keystone.list('Like'),
	BillPart = keystone.list('BillPart'),

	TextHelper = require('../../helpers/TextHelper'),
	LikeHelper = require('../../helpers/LikeHelper'),
	BallotHelper = require('../../helpers/BallotHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Text, 'ERROR_TEXT_NOT_FOUND', 'ERROR_TEXT_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Text);

exports.addBillPartLike = LikeHelper.getAddLikeFunc(BillPart, 'ERROR_BILL_PART_NOT_FOUND', 'ERROR_BILl_PART_ALREADY_LIKED');

exports.removeBillPartLike = LikeHelper.getRemoveLikeFunc(BillPart);

/**
 * List Texts
 */
exports.list = function(req, res)
{
	Text.model.find()
		.populate('likes')
		.select('-parts')
		.exec(function(err, texts)
	    {
			if (err)
				return res.apiError('database error', err);

			texts = TextHelper.filterReadableTexts(texts, req, true)
			for (var i = 0; i < texts.length; ++i)
				texts[i].likes = LikeHelper.filterUserLikes(texts[i].likes, req.user);

			res.apiResponse({ texts : texts });
		});
}

/**
 * Get Text by ID
 */
exports.get = function(req, res)
{
	Text.model.findById(req.params.id)
		.deepPopulate('likes parts.likes')
		.exec(function(err, text)
    {
		if (err)
			return res.apiError('database error', err);

		if (!text)
			return res.apiError('not found');

		if (!TextHelper.textIsReadable(text, req))
			return res.status(403).send();

		text.likes = LikeHelper.filterUserLikes(text.likes, req.user);
		for (var part of text.parts)
			part.likes = LikeHelper.filterUserLikes(part.likes, req.user);

		res.apiResponse({ text : text });
	});
}

exports.latest = function(req, res)
{
	Text.model.find()
		.sort('-publishedAt')
		.limit(10)
		.populate('likes')
		.select('-parts')
		.exec(function(err, texts)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!texts)
				return res.apiError('not found');

			texts = TextHelper.filterReadableTexts(texts, req, true)
			for (var i = 0; i < texts.length; ++i)
				texts[i].likes = LikeHelper.filterUserLikes(texts[i].likes, req.user);

			res.apiResponse({ texts : texts });
		});
}

exports.getBallot = function(req, res)
{
	BallotHelper.getByTextIdAndVoter(
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

/**
 * Get Text by slug
 */
exports.getBySlug = function(req, res)
{
	Text.model.findOne()
		.where('slug', req.params.slug)
		.populate('likes')
		.populate('parts')
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);

			if (!text)
				return res.status(404).send();

			if (!TextHelper.textIsReadable(text, req))
				return res.status(403).send();

			text.likes = LikeHelper.filterUserLikes(text.likes, req.user);
			for (var part of text.parts)
				part.likes = LikeHelper.filterUserLikes(part.likes, req.user);

			res.apiResponse({ text: text });
		});
}

function updateBillSources(user, text, next)
{
    var mdLinkRegex = new RegExp(/\[([^\[]+)\]\(([^\)]+)\)/g);
    var ops = [function(callback) { callback(null, []); }];

    while (match = mdLinkRegex.exec(text.content.md))
    {
        (function(url) {
            ops.push(function(result, callback)
            {
                // FIXME: do not fetch pages that are already listed in the text sources
                Source.fetchPageTitle(url, function(err, title)
                {
                    if (err)
                        result.push({url: url, title: ''});
                    else
                        result.push({url: url, title: title});

                    callback(null, result);
                });
            });
        })(match[2]);
    }

    async.waterfall(ops, function(error, result)
    {
        var saveOps = [
            function(callback)
            {
				var urls = result.map(function(sourceData) { return sourceData.url; });
                Source.model.find({text: text, auto: true, url: {$nin : urls}})
					.remove(function(err)
	                {
	                    callback(err);
	                });
            }
        ];

        if (error)
        {
            console.log(error);
            next(error); // FIXME: retry later
        }
        else
        {
            saveOps = saveOps.concat(result.map(function(sourceData)
            {
                return function(callback)
                {
                    Source.model.findOne({url : sourceData.url, text : text})
                        .exec(function(err, source)
                        {
                            if (err)
                                return callback(err);

                            if (source && source.title == sourceData.title)
                                return callback(err);

                            if (!source)
                            {
                                source = Source.model({
                                    title: sourceData.title,
                                    url: sourceData.url,
                                    auto: true,
                                    author: bcrypt.hashSync(user.sub, 10),
                                    text: text
                                });
                            }

                            source.save(function(err)
                            {
                                return callback(err);
                            });
                        });
                };
            }));

            async.waterfall(saveOps, function(error)
            {
                next(error);
            });
        }
    });
}

function getBillParts(md)
{
	var tree = markdown.parse(md);
	var order = 0;
	var part = BillPart.model({level:0,order:order});
	var parts = [];
	var para = [];

	for (var i = 1; i < tree.length; ++i)
	{
		if (tree[i][0] == 'header')
		{
			part.content = JSON.stringify(para);
			parts.push(part);

			part = BillPart.model();
			part.title = tree[i][2];
			part.level = tree[i][1].level;
			part.order = order++;

			para = [];
		}
		else if (tree[i][0] == 'para')
		{
			tree[i].shift();
			para.push(tree[i]);
		}
	}

	if (para.length != 0)
		part.content = JSON.stringify(para);

	if (parts.indexOf(part) < 0)
		parts.push(part);

	return parts;
}

function updateBillParts(text, callback)
{
	var parts = getBillParts(text.content.md);
	console.log(parts);
	var removeOps = text.parts.map(function(part)
	{
		return function(callback)
		{
			part.remove(function(err)
			{
				callback(err);
			});
		};
	});
	var saveOps = parts.map(function(part)
	{
		return function(callback)
		{
			part.save(function(err, res)
			{
				callback(err);
			});
		};
	});

	async.waterfall(
		removeOps.concat(saveOps),
		function(error)
		{
			text.parts = parts;
			callback(error);
		}
	);
}

function updateBill(text, user, callback)
{
	updateBillSources(user, text, function(error)
	{
		if (error)
			return callback(error);

		updateBillParts(text, function(error)
		{
			callback(error);
		})
	});
}

function pushVoteOnQueue(bill, callback)
{
	if (!config.blockchain.voteEnabled)
		return callback(null, null);

	require('amqplib/callback_api').connect(
		'amqp://localhost',
		function(err, conn)
		{
			if (err != null)
				return callback(err, null);

			conn.createChannel(function(err, ch)
			{
				if (err != null)
					return callback(err, null);

				var voteMsg = { vote : { id : bill.id } };

				ch.assertQueue('pending-votes');
				ch.sendToQueue(
					'pending-votes',
					new Buffer(JSON.stringify(voteMsg)),
					{ persistent : true }
				);

				callback(null, voteMsg);
			});
		}
	);
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
		.select('-likes')
		.populate('parts')
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (text && !TextHelper.textIsReadable(text, req))
				return res.status(403).send();

			if (!text)
			{
				updateBill(newText, req.user, function(err)
				{
					if (err)
						return res.apiError('database error', err);

					newText.author = bcrypt.hashSync(req.user.sub, 10);

					newText.save(function(err, text)
					{
						if (err)
							return res.apiError('database error', err);

						pushVoteOnQueue(text, function(error, voteMsg)
						{
							if (error)
								return res.apiError('queue error', error);

							return res.apiResponse({
								action: 'create',
								text : newText
							});
						});
					});

				});
			}
			else
			{
				if (bcrypt.compareSync(req.user.sub, text.author))
				{
					text.title = newText.title;
					text.content.md = newText.content.md;

					updateBill(text, req.user, function(err)
					{
						if (err)
							return res.apiError('database error', err);

						text.save(function(err, text)
						{
							if (err)
								return res.apiError('database error', err);

							delete text.likes;

							return res.apiResponse({
								action: 'update',
								text : text
							});
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
	Text.model.findById(req.params.id)
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);

			if (!text)
				return res.status(404).send();

			if (!bcrypt.compareSync(req.user.sub, text.author))
				return res.status(403).send();

			if (req.params.status == 'published' && text.status != 'published')
				text.publishedAt = Date.now();

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
