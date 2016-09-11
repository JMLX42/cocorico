var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var async = require('async');

var Vote = keystone.list('Vote'),
    Ballot = keystone.list('Ballot'),

    BallotHelper = require('../../helpers/BallotHelper');

exports.list = function(req, res) {
    Ballot.find().exec((err, ballots) => {
        if (err)
            return res.apiError('database error', err);

        return res.apiResponse({ballots: ballots});
    });
}

exports.get = function(req, res)
{
	BallotHelper.getByVoteIdAndVoter(
		req.params.voteId,
		req.user.sub,
		(err, ballot) => {
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

function pushBallotMessageOnQueue(data, callback)
{
    try {
        require('amqplib/callback_api').connect(
            'amqp://localhost',
            (err, conn) => {
                if (err != null)
                    return callback(err, null);

                conn.createChannel((err, ch) => {
                    if (err != null)
                        return callback(err, null);

                    var ballotObj = { ballot : data };

                    ch.assertQueue('ballots');
                    ch.sendToQueue(
                        'ballots',
                        new Buffer(JSON.stringify(ballotObj)),
                        { persistent : true }
                    );

                    callback(null, ballotObj);
                });
            }
        );
    }
    catch (e) {
        callback(e, null);
    }
}

function ballotTransactionError(res, ballot, msg)
{
    ballot.status = 'error';
    ballot.error = JSON.stringify(msg);
    ballot.save(function(err)
    {
        if (err)
            return res.apiError('database error', err);

        return res.status(400).send({error:msg});
    });
}

exports.vote = function(req, res) {
    if (!config.capabilities.vote.enabled)
        return res.status(403).send();

    var signedTx = new EthereumTx(req.body.transaction);
    var voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

    async.waterfall(
        [
            (callback) => Vote.model.findById(req.params.voteId)
                .exec(callback),
            (vote, callback) => {
                if (!vote)
        			return callback({code: 404, error: 'vote not found'});
                // FIXME: log the unauthorized attempt
                if (!vote.userIsAuthorizedToVote(req.user))
                    return callback({code: 403, error: 'unauthorized user'});
                if (vote.voteContractAddress != voteContractAddress)
                    return callback({code: 300, error: 'contract address mismatch'});

                BallotHelper.getByVoteIdAndVoter(
                    vote.id,
                    req.user.sub,
                    (err, ballot) => callback(err, vote, ballot)
                );
            },
            (vote, ballot, callback) => {
                if (!!ballot)
                    return callback({code: 403, error: 'user already voted'});

                var ballot = Ballot.model({
                    vote: vote,
                    voter: bcrypt.hashSync(req.user.sub, 10),
                    status: 'queued'
                });

                ballot.save((err, ballot) => callback(err, vote, ballot));
            },
            (vote, ballot, callback) => pushBallotMessageOnQueue(
                {
                    id: ballot.id,
                    transaction: req.body.transaction,
                    voteContractAddress: vote.voteContractAddress,
                    voteContractABI: JSON.parse(vote.voteContractABI)
                },
                (err, msg) => callback(err, ballot)
            )
        ],
        (err, ballot) => {
            if (err) {
                if (ballot) {
                    return ballotTransactionError(res, ballot, err);
                }
                if (err.code) {
                    res.status(err.code);
                }
                if (err.error) {
                    return res.apiError(err.error);
                }
                return res.apiError(err);
            }
            return res.apiResponse({ballot: ballot});
        }
    );
}

exports.cancel = function(req, res)
{
    if (!config.capabilities.vote.vote)
        return res.status(403).send();

	// Vote.model.findById(req.params.id).exec(function(err, vote)
	// {
	// 	if (err)
	// 		return res.apiError('database error', err);
	// 	if (!vote)
	// 		return res.apiError('not found');
    //
	// 	BallotHelper.getByVoteIdAndVoter(
	// 		req.params.id,
	// 		req.user.sub,
	// 		function(err, ballot)
	// 		{
	// 			if (err)
	// 				return res.apiError('database error', err);
    //
	// 			if (!ballot)
	// 				return res.status(404).apiResponse({
	// 					error: 'ballot does not exist'
	// 				});
    //
	// 			Ballot.model.findById(ballot.id).remove(function(err)
	// 			{
	// 				var client = redis.createClient();
	// 				var key = 'ballot/' + req.params.id + '/' + req.user.sub;
    //
	// 				if (err)
	// 					return res.apiError('database error', err);
    //
	// 				client.on('connect', function()
	// 				{
	// 					client.del(key, function(err, reply)
	// 					{
	// 						if (err)
	// 							console.log(err);
    //
	// 						return res.apiResponse({ ballot: 'removed' });
	// 					});
	// 				});
	// 			});
	// 		});
	// });
}
