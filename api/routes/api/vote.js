var config = require('../../config.json');

var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var Web3 = require('web3');
var async = require('async');

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

            res.apiResponse({result : null});
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

            res.apiResponse({result : null});
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

            res.apiResponse({result : null});
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

            var web3 = new Web3();
            web3.setProvider(new web3.providers.HttpProvider(
                "http://127.0.0.1:8545"
            ));

            web3.eth.contract(JSON.parse(bill.voteContractABI)).at(
                bill.voteContractAddress,
                (err, voteInstance) => res.apiResponse(
                    {result : voteInstance.getVoteResults().map((s) => parseInt(s))}
                )
            );
        });
}

function pushBallotMessageOnQueue(data, callback)
{
    if (config.capabilities.bill.vote != 'blockchain')
        return callback(null, null);

    try {
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

function birthdateToAge(birthdate)
{
    if (!birthdate)
        return 0;

    return Math.floor(
        (Date.now() - new Date(birthdate)) / 1000
        / (60 * 60 * 24) / 365.25
    );
}

exports.vote = function(req, res)
{
    if (!config.capabilities.bill.vote)
        return res.status(403).send();

    var signedTx = new EthereumTx(req.body.transaction);
    var voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

    async.waterfall(
        [
            (callback) => Bill.model
                .findOne({voteContractAddress:voteContractAddress})
                .exec(callback),
            (bill, callback) => {
                if (!bill)
        			return callback({code: 404, msg: 'bill not found'}, null);

        		if (!BillHelper.billIsReadable(bill, req))
        			return callback({code: 403, msg: 'invalid bill'}, null);

                BallotHelper.getByBillIdAndVoter(
        			bill.id,
        			req.user.sub,
                    (err, ballot) => callback(null, bill, ballot)
                );
            },
            (bill, ballot, callback) => {
                if (ballot && ballot.status != 'cancelled')
                    return callback({code: 403, msg: 'user already voted'}, null);

                var ballot = Ballot.model({
                    bill: bill,
                    voter: bcrypt.hashSync(req.user.sub, 10),
                    status: config.capabilities.bill.vote == 'blockchain'
                        ? 'queued'
                        : 'complete'
                });

                ballot.save((err, ballot) => callback(null, bill, ballot));
            },
            (bill, ballot, callback) => pushBallotMessageOnQueue(
                {
                    id: ballot.id,
                    action: 'vote',
                    transaction: req.body.transaction,
                    voteContractAddress: bill.voteContractAddress,
                    voteContractABI: JSON.parse(bill.voteContractABI)
                },
                (err, ballotMsg) => callback(null, ballot)
            )
        ],
        (err, ballot) => {
            if (err)
                return ballotTransactionError(res, ballot, err);

            return res.apiResponse({ ballot: ballot });
        }
    );
}

exports.remove = function(req, res)
{
    if (!config.capabilities.vote.cancel)
        return res.status(403).send();

    var signedTx = new EthereumTx(req.body.transaction);
    var voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

    async.waterfall(
        [
            (callback) => Bill.model
                .findOne({voteContractAddress:voteContractAddress})
                .exec(callback),
            (bill, callback) => {
        		if (!bill)
        			return callback({msg: 'bill not found', code: 404}, null);

        		if (!BillHelper.billIsReadable(bill, req))
        			return callback({msg: 'invalid bill', code: 403}, null);

                BallotHelper.getByBillIdAndVoter(
                    bill.id,
                    req.user.sub,
                    (err, ballot) => callback(err, bill, ballot)
                );
            },
            (bill, ballot, callback) => {
                if (!ballot)
                    return callback({msg: 'ballot not found', code: 404}, null);

                if (ballot.status != 'complete' && ballot.status != 'error')
                    return callback({msg: 'invalid ballot status', code: 403}, null);

                pushBallotMessageOnQueue(
                    {
                        id: ballot.id,
                        action: 'cancelVote',
                        transaction: req.body.transaction,
                        voteContractAddress: bill.voteContractAddress,
                        voteContractABI: JSON.parse(bill.voteContractABI)
                    },
                    callback
                );
            }
        ],
        (err, result) => {
            if (err)
            {
                if (err.code)
                    res.status(err.code);
                return res.apiResponse(err.msg);
            }

            return res.apiResponse({ ballot: 'removed' });
        }
    );
}
