var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var async = require('async');

var Text = keystone.list('Text'),
	Ballot = keystone.list('Ballot'),
	Source = keystone.list('Source'),
	Like = keystone.list('Like'),

	TextHelper = require('../../helpers/TextHelper'),
	LikeHelper = require('../../helpers/LikeHelper'),
	BallotHelper = require('../../helpers/BallotHelper');

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

			res.apiResponse({ texts: TextHelper.filterReadableTexts(texts, req, true) });
		});
}

/**
 * Get Text by ID
 */
exports.get = function(req, res)
{
	Text.model.findById(req.params.id)
		.populate('likes')
		.exec(function(err, text)
    {
		if (err)
			return res.apiError('database error', err);

		if (!text)
			return res.apiError('not found');

		if (!TextHelper.textIsReadable(text, req))
			return res.status(403).send();

		text.likes = LikeHelper.filterUserLikes(text.likes, req.user);

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

			res.apiResponse({ texts: TextHelper.filterReadableTexts(texts, req, true) });
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
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!text)
				return res.status(404).send();
			if (!TextHelper.textIsReadable(text, req))
				return res.status(403).send();

			res.apiResponse({ text: text });
		});
}

function updateTextSources(user, text, next)
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
                    Source.model.findOne({url : sourceData.url})
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
                next();
            });
        }
    });
}

function mineVoteContract(callback)
{
	var Web3 = require('web3');
	var web3 = new Web3();
	web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

	var Vote = require('/opt/cocorico/blockchain/Vote.json');
	var voteContract = web3.eth.contract(eval(Vote.contracts.Vote.abi));
	var voteInstance = voteContract.new(
		3, // num proposals
		{
			from    : web3.eth.accounts[0],
			data    : Vote.contracts.Vote.bin,
			gas     : 300000
		},
		function(error, contract)
		{
			if (error)
				return callback(error, null);

			if (!contract)
				return;

			if (!contract.address)
			{
				// tx sent, hash = contract.transactionHash
			}
			else
			{
				// tx mined
				callback(null, contract);
			}
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
		.exec(function(err, text)
	    {
			if (err)
				return res.apiError('database error', err);
			if (text && !TextHelper.textIsReadable(text, req))
				return res.status(403).send();

			if (!text)
			{
				updateTextSources(req.user, newText, function(err)
				{
					newText.author = bcrypt.hashSync(req.user.sub, 10);

					mineVoteContract(function(error, contract)
					{
						if (error)
							return res.apiError('blockchain error', error);

						newText.voteContractAddress = contract.address;

						newText.save(function(err, text)
						{
							if (err)
								return res.apiError('database error', err);

							return res.apiResponse({
								action: 'create',
								text : newText
							})
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
					updateTextSources(req.user, text, function(err)
					{
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

exports.addLike = function(req, res)
{
    LikeHelper.addLike(
        Text.model, req.params.id, req.user, req.params.value == 'true',
        function(err, resource, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!resource)
                return res.status(404).apiResponse({
					error: 'error.ERROR_TEXT_NOT_FOUND'
				});

            if (like)
                return res.status(400).apiResponse({
                    error: 'error.ERROR_TEXT_ALREADY_LIKED'
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
        Text.model, req.params.id, req.user,
        function(err, resource, like)
        {
            if (err)
                return res.apiError('database error', err);

            if (!resource || !like)
                return res.status(404).apiResponse();
        },
        function(resource, like)
        {
            res.apiResponse({ like : like });
        }
    );
}
