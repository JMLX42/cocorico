var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var async = require('async');
var markdown = require('markdown').markdown;

var Bill = keystone.list('Bill'),
	Ballot = keystone.list('Ballot'),
	Source = keystone.list('Source'),
	Like = keystone.list('Like'),
	BillPart = keystone.list('BillPart'),

	BillHelper = require('../../helpers/BillHelper'),
	LikeHelper = require('../../helpers/LikeHelper'),
	BallotHelper = require('../../helpers/BallotHelper'),
	SourceHelper = require('../../helpers/SourceHelper'),
	UserProfileHelper = require('../../helpers/UserProfileHelper');

exports.addLike = LikeHelper.getAddLikeFunc(Bill, 'ERROR_bill_NOT_FOUND', 'ERROR_bill_ALREADY_LIKED');

exports.removeLike = LikeHelper.getRemoveLikeFunc(Bill);

exports.addBillPartLike = LikeHelper.getAddLikeFunc(BillPart, 'ERROR_BILL_PART_NOT_FOUND', 'ERROR_BILl_PART_ALREADY_LIKED');

exports.removeBillPartLike = LikeHelper.getRemoveLikeFunc(BillPart);

/**
 * List Bills
 */
exports.list = function(req, res)
{
	if (!config.capabilities.bill.read)
		return res.status(403).send();

	Bill.model.find()
		.populate('likes')
		.select('-parts')
		.exec(function(err, bills)
	    {
			if (err)
				return res.apiError('database error', err);

			bills = BillHelper.filterReadableBills(bills, req, true)
			for (var i = 0; i < bills.length; ++i)
				bills[i].likes = LikeHelper.filterUserLikes(bills[i].likes, req.user);

			res.apiResponse({ bills : bills });
		});
}

/**
 * Get Bill by ID
 */
exports.get = function(req, res)
{
	if (!config.capabilities.bill.read)
		return res.status(403).send();

	Bill.model.findById(req.params.id)
		.deepPopulate('likes parts.likes')
		.exec(function(err, bill)
    {
		if (err)
			return res.apiError('database error', err);

		if (!bill)
			return res.apiError('not found');

		if (!BillHelper.billIsReadable(bill, req))
			return res.status(403).send();

		bill.likes = LikeHelper.filterUserLikes(bill.likes, req.user);
		for (var part of bill.parts)
			part.likes = LikeHelper.filterUserLikes(part.likes, req.user);

		res.apiResponse({ bill : bill });
	});
}

exports.latest = function(req, res)
{
	if (!config.capabilities.bill.read)
		return res.status(403).send();

	Bill.model.find()
		.sort('-publishedAt')
		.limit(10)
		.populate('likes')
		.select('-parts')
		.exec(function(err, bills)
	    {
			if (err)
				return res.apiError('database error', err);
			if (!bills)
				return res.apiError('not found');

			bills = BillHelper.filterReadableBills(bills, req, true)
			for (var i = 0; i < bills.length; ++i)
				bills[i].likes = LikeHelper.filterUserLikes(bills[i].likes, req.user);

			res.apiResponse({ bills : bills });
		});
}

exports.getBallot = function(req, res)
{
	BallotHelper.getByBillIdAndVoter(
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

	// if (!req.user || !req.user.sub)
	// 	return res.status(401).apiResponse({error: 'NOT_LOGGED_IN'});
	//
	// Ballot.model.findOne({bill:req.params.id})
	// 	.$where(UserProfileHelper.getWhereUserFunction(req.user))
	// 	.exec(function(err, ballot)
	// 	{
	// 		if (err)
	// 			return res.apiError('database error', err);
	//
	// 		if (!ballot)
	// 			return res.status(404).apiResponse({
	// 				error: 'ballot does not exist'
	// 			});
	//
	// 		return res.apiResponse({ ballot: ballot });
	// 	});
}

/**
 * Get Bill by slug
 */
exports.getBySlug = function(req, res)
{
	if (!config.capabilities.bill.read)
		return res.status(403).send();

	Bill.model.findOne({slug : req.params.slug})
		.deepPopulate('likes parts.likes')
		.exec(function(err, bill)
	    {
			if (err)
				return res.apiError('database error', err);

			if (!bill)
				return res.apiError('not found');

			if (!BillHelper.billIsReadable(bill, req))
				return res.status(403).send();

			bill.likes = LikeHelper.filterUserLikes(bill.likes, req.user);
			for (var part of bill.parts)
				part.likes = LikeHelper.filterUserLikes(part.likes, req.user);

			res.apiResponse({ bill : bill });
		});
}

function updateBillSources(user, bill, next)
{
    var mdLinkRegex = new RegExp(/\[([^\[]+)\]\(([^\)]+)\)/g);
    var ops = [function(callback) { callback(null, []); }];

    while (match = mdLinkRegex.exec(bill.content.md))
    {
        (function(url) {
            ops.push(function(result, callback)
            {
                // FIXME: do not fetch pages that are already listed in the bill sources
                SourceHelper.fetchPageTitle(url, function(err, title)
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
                Source.model.find({bill: bill, auto: true, url: {$nin : urls}})
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
                    Source.model.findOne({url : sourceData.url, bill : bill})
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
                                    bill: bill
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
	var part = BillPart.model({level:0,order:order,title:''});
	var parts = [];
	var para = [];

	for (var i = 1; i < tree.length; ++i)
	{
		if (tree[i][0] == 'header')
		{
			if (para.length != 0 || part.title != '')
			{
				console.log(para);
				console.log(part.title);
				part.content = JSON.stringify(para);
				parts.push(part);
			}

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

	if (parts.indexOf(part) < 0 && (part.content != '[]' || part.title != ''))
		parts.push(part);

	return parts;
}

function updateBillParts(bill, callback)
{
	async.waterfall(
		bill.parts.map(function(part)
		{
			return function(callback)
			{
				part.remove(function(err)
				{
					callback(err);
				});
			};
		}),
		function(error)
		{
			if (error)
				callback(error);

			var billParts = getBillParts(bill.content.md);

			async.waterfall(
				billParts.map(function(part)
				{
					return function(callback)
					{
						part.save(function(err, res)
						{
							callback(err);
						});
					};
				}),
				function(error)
				{
					bill.parts = billParts;
					callback(error);
				}
			)
		}
	);
}

function updateBill(bill, user, callback)
{
	updateBillSources(user, bill, function(error)
	{
		if (error)
			return callback(error);

		updateBillParts(bill, function(error)
		{
			callback(error);
		})
	});
}

function pushVoteOnQueue(bill, callback)
{
	if (!config.capabilities.bill.vote == 'blockchain')
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

	var newBill = Bill.model({
		title: req.body.title,
		content: { md: req.body.content }
	});

	Bill.model.findOne(req.body.id ? {_id : req.body.id} : {slug: newBill.slug})
		.select('-likes')
		.populate('parts')
		.exec(function(err, bill)
	    {
			if (err)
				return res.apiError('database error', err);
			if (bill && !BillHelper.billIsReadable(bill, req))
				return res.status(403).send();

			if (!bill)
			{
				if (!config.capabilities.bill.create)
					return res.status(403).send();

				updateBill(newBill, req.user, function(err)
				{
					if (err)
						return res.apiError('database error', err);

					newBill.author = bcrypt.hashSync(req.user.sub, 10);

					newBill.save(function(err, bill)
					{
						if (err)
							return res.apiError('database error', err);

						pushVoteOnQueue(bill, function(error, voteMsg)
						{
							if (error)
								return res.apiError('queue error', error);

							bill.likes = undefined;
							bill.parts = undefined;

							return res.apiResponse({
								action: 'create',
								bill : newBill
							});
						});
					});

				});
			}
			else
			{
				if (!config.capabilities.bill.edit)
					return res.status(403).send();

				if (bcrypt.compareSync(req.user.sub, bill.author))
				{
					bill.title = newBill.title;
					bill.content.md = newBill.content.md;

					updateBill(bill, req.user, function(err)
					{
						if (err)
							return res.apiError('database error', err);

						bill.save(function(err, bill)
						{
							if (err)
								return res.apiError('database error', err);

							// delete bill.likes;
							// delete bill.parts;

							return res.apiResponse({
								action: 'update',
								bill : bill
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
// 	Bill.model.findById(req.params.id).remove(function(err)
// 	{
// 		if (err)
// 			return res.apiError('database error', err);
//
// 		return res.apiResponse({action: 'deleted'});
// 	});
// }

exports.status = function(req, res)
{
	if (!config.capabilities.bill.edit)
		return res.status(403).send();

	Bill.model.findById(req.params.id)
		.select('status author')
		.exec(function(err, bill)
	    {
			if (err)
				return res.apiError('database error', err);

			if (!bill)
				return res.status(404).send();

			if (!bcrypt.compareSync(req.user.sub, bill.author))
				return res.status(403).send();

			if (req.params.status == 'published' && bill.status != 'published')
				bill.publishedAt = Date.now();

			bill.status = req.params.status;
			bill.save(function(err)
			{
				if (err)
					return res.apiError('database error', err);

				return res.apiResponse({
					action: 'update',
					bill : bill
				});
			});
		});
}
