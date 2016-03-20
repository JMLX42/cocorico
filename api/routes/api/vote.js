var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var Web3 = require('web3');

var Bill = keystone.list('Bill'),
    Ballot = keystone.list('Ballot'),

    BillHelper = require('../../helpers/BillHelper'),
	BallotHelper = require('../../helpers/BallotHelper');

exports.resultPerDate = function(req, res)
{
    var billId = req.params.billId;

    Bill.model.findById(billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).send();

            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'published')
                return res.status(403).send();

            Ballot.model.find({bill : bill})
                .exec(function(err, ballots)
                {
                    if (err)
                        return res.apiError('database error', err);

                    var result = {
                        yes     : {},
                        no      : {},
                        blank   : {}
                    };

                    for (var ballot of ballots)
                    {
                        var date = new Date(ballot.time).toISOString().slice(0, 10);

                        if (!(date in result[ballot.value]))
                            result[ballot.value][date] = 1;
                        else
                            result[ballot.value][date] += 1;
                    }

                    res.apiResponse({result : result});
                });
        });
}

exports.resultPerGender = function(req, res)
{
    var billId = req.params.billId;

    Bill.model.findById(billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).send();

            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'published')
                return res.status(403).send();

            Ballot.model.find({bill : bill})
                .exec(function(err, ballots)
                {
                    if (err)
                        return res.apiError('database error', err);

                    var result = {
                        yes     : {male : 0, female : 0},
                        no      : {male : 0, female : 0},
                        blank   : {male : 0, female : 0}
                    };

                    for (var ballot of ballots)
                        if (ballot.voterGender)
                            result[ballot.value][ballot.voterGender] += 1;

                    res.apiResponse({result : result});
                });
        });
}

exports.resultPerAge = function(req, res)
{
    var billId = req.params.billId;

    Bill.model.findById(billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).send();

            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'published')
                return res.status(403).send();

            Ballot.model.find({bill : bill})
                .exec(function(err, ballots)
                {
                    if (err)
                        return res.apiError('database error', err);

                    var result = {};
                    for (var ballot of ballots)
                        if (ballot.voterAge)
                        {
                            if (!(ballot.voterAge in result))
                                result[ballot.voterAge] = {
                                    yes     : 0,
                                    no      : 0,
                                    blank   : 0
                                };

                            result[ballot.voterAge][ballot.value] += 1;
                        }

                    res.apiResponse({result : result});
                });
        });
}

exports.result = function(req, res)
{
    var billId = req.params.billId;

    Bill.model.findById(billId)
        .exec(function(err, bill)
        {
            if (err)
                return res.apiError('database error', err);

            if (!bill)
                return res.status(404).send();

            if (!BillHelper.billIsReadable(bill, req)
                || bill.status != 'published')
                return res.status(403).send();

            Ballot.model.find({bill : bill})
                .exec(function(err, ballots)
                {
                    if (err)
                        return res.apiError('database error', err);

                    var result = {
                        yes     : 0,
                        no      : 0,
                        blank   : 0
                    };

                    for (var ballot of ballots)
                        result[ballot.value] += 1;

                    res.apiResponse({result : result});
                });
        });
}

function pushBallotOnQueue(bill, ballot, extra, callback)
{
    if (config.capabilities.bill.vote != 'blockchain')
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

                var ballotObj = {
                    ballot : {
                        id : ballot.id,
                        voteContractAddress : bill.voteContractAddress,
                        address: ballot.address
                    }
                };

                if (extra)
                    for (var propertyName in extra)
                        ballotObj.ballot[propertyName] = extra[propertyName];

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

function getVoteContractInstance(web3, address, callback)
{
    var Vote = require('/opt/cocorico/blockchain/Vote.json');
    var voteContract = web3.eth.contract(eval(Vote.contracts.Vote.abi));
    var voteInstance = voteContract.at(
        address,
        function(err, voteInstance)
        {
            if (err)
                return callback(err, null);

            return callback(null, voteInstance);
        }
    );
}

function getBallotTransactionParameters(address, voteContractAdress, value, callback)
{
    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

    getVoteContractInstance(
        web3,
        voteContractAdress,
        function(err, voteInstance)
        {
            if (err)
                return callback(err, null);

            var params = {
                from: address,
                gas: web3.toHex(999999),
                gasPrice: web3.eth.gasPrice.toString(10),
                to: web3.toHex(voteContractAdress),
                data: voteInstance.vote.getData(value),
                nonce: web3.toHex(web3.eth.getTransactionCount(address)),
                value: '0x00'
            };

            callback(null, params);
        }
    );
}

function vote(req, res, value)
{
    if (!config.capabilities.bill.vote)
        return res.status(403).send();

	Bill.model.findById(req.params.id).exec(function(err, bill)
	{
		if (err)
			return res.apiError('database error', err);
		if (!bill)
			return res.apiError('not found');

		if (!BillHelper.billIsReadable(bill, req))
			return res.status(403).send();

		BallotHelper.getByBillIdAndVoter(
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

                var age = 0;
                if (req.user.birthdate)
                    age = Math.floor(
                        (Date.now() - new Date(req.user.birthdate)) / 1000
                        / (60 * 60 * 24) / 365.25
                    );

                getBallotTransactionParameters(
                    req.params.address,
                    bill.voteContractAddress,
                    ['yes', 'blank', 'no'].indexOf(value),
                    function(err, params)
                    {
                        var ballot = Ballot.model({
                            bill: bill,
                            voter: bcrypt.hashSync(req.user.sub, 10),
                            value: value,
                            voterAge : age,
                            voterGender : req.user.gender,
                            status: config.capabilities.bill.vote == 'blockchain'
                                ? 'signing'
                                : 'complete',
                            address: req.params.address,
                            transactionParameters: JSON.stringify(params)
                        });

                        ballot.save(function(err, result)
                        {
                            if (err)
                                return res.apiError('database error', err);

                            return res.apiResponse({ ballot : ballot });
                        });
                    }
                );
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

exports.remove = function(req, res)
{
    if (!config.capabilities.bill.vote)
        return res.status(403).send();

	Bill.model.findById(req.params.id).exec(function(err, bill)
	{
		if (err)
			return res.apiError('database error', err);
		if (!bill)
			return res.apiError('not found');

		if (!BillHelper.billIsReadable(bill, req))
			return res.status(403).send();

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

function ballotTransactionError(res, ballot, msg)
{
    ballot.status = 'error';
    ballot.save(function(err)
    {
        if (err)
            return res.apiError('database error', err);

        return res.status(401).send({error:msg});
    });
}

exports.transaction = function(req, res)
{
    if (!config.capabilities.bill.vote || config.capabilities.bill.vote != 'blockchain')
        return res.status(403).send();

    Bill.model.findById(req.params.id).exec(function(err, bill)
	{
		if (err)
			return res.apiError('database error', err);
		if (!bill)
			return res.apiError('not found');

		if (!BillHelper.billIsReadable(bill, req))
			return res.status(403).send();

        BallotHelper.getByBillIdAndVoter(
            req.params.id,
            req.user.sub,
            function(err, ballot)
            {
                if (err)
                    return res.apiError('database error', err);

                // FIXME: log an error somewhere, probably block the user account
                if (!ballot)
                    return res.status(404).send();

                // if the ballot original address and the request address parameter
                // do not match then there is something wrong
                // FIXME: log an error somewhere, probably block the user account
                if (ballot.address != req.params.address)
                    return res.status(403).send();

                // we have to check this is not any transaction but the one we expect
                var txParams = JSON.parse(ballot.transactionParameters);
                var signedTx = new EthereumTx(req.params.transaction);

                // if the address does not match, the transaction does not come from
                // the right account
                if (EthereumUtil.bufferToHex(signedTx.getSenderAddress()) != ballot.address)
                    return ballotTransactionError(res, ballot, 'invalid transaction address');

                // if the transaction parameters are not the one we prepared, the
                // transaction is not properly formed
                for (var paramName of ['to', 'from', 'data'])
                    if (EthereumUtil.bufferToHex(signedTx[paramName]) != txParams[paramName])
                        return ballotTransactionError(
                            res,
                            ballot,
                            'invalid transaction parameter \'' + paramName + '\''
                        );

                pushBallotOnQueue(
                    bill,
                    ballot,
                    { transaction: req.params.transaction },
                    function(err, ballotMsg)
                    {
                        if (err)
                            return res.apiError('queue error', err);

                        ballot.status = 'pending';
                        ballot.save(function(err)
                        {
                            if (err)
                                return res.apiError('database error', err);

                            return res.apiResponse({ ballot : ballot });
                        })
                    }
                );
            }
        );
    });
}
