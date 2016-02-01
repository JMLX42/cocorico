var keystone = require('keystone');
var bcrypt = require('bcrypt');
var redis = require('redis');
var timeout = require('req-timeout');

var Text = keystone.list('Text'),
    Ballot = keystone.list('Ballot'),

    TextHelper = require('../../helpers/TextHelper'),
    BlockchainHelper = require('../../helpers/BlockchainHelper'),

    EthereumAccounts = require('ethereumjs-accounts'),
    HookedWeb3Provider = require("hooked-web3-provider"),
    Web3 = require('web3');

exports.resultPerDate = function(req, res)
{
    var textId = req.params.textId;

    Text.model.findById(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'published')
                return res.status(403).send();

            Ballot.model.find({text : text})
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
    var textId = req.params.textId;

    Text.model.findById(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'published')
                return res.status(403).send();

            Ballot.model.find({text : text})
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
    var textId = req.params.textId;

    Text.model.findById(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'published')
                return res.status(403).send();

            Ballot.model.find({text : text})
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
    var textId = req.params.textId;

    Text.model.findById(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            if (!TextHelper.textIsReadable(text, req)
                || text.status != 'published')
                return res.status(403).send();

            Ballot.model.find({text : text})
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

function initializeVoterAccount(address, callback)
{
    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

    web3.eth.sendTransaction(
        {
            from    : web3.eth.accounts[0],
            to      : address,
            value   : web3.toWei(10, "ether")
        },
        function(error, result)
        {
            BlockchainHelper.whenTransactionMined(
                web3,
                result,
                function(err, block)
                {
                    if (err)
                        return callback(err, null);

                    return callback(null, block);
                }
            );
        }
    );
}

function blockchainVote(voteContractAdress, proposal, callback)
{
    var web3 = new Web3();
    var accounts = new EthereumAccounts({ web3 : web3});
    var userAccount = accounts.new(null); // no passphrase

    web3.setProvider(new HookedWeb3Provider({
        host: "http://127.0.0.1:8545",
        transaction_signer: accounts
    }));

    initializeVoterAccount(
        userAccount.address,
        function(err, block)
        {
            if (err)
                return callback(err, null);

            var transactionHash = '';
            var Vote = require('/opt/cocorico/blockchain/Vote.json');
            var voteContract = web3.eth.contract(eval(Vote.contracts.Vote.abi));
            var voteInstance = voteContract.at(
                voteContractAdress,
                function(err, voteInstance)
                {
                    var ballotEvent = voteInstance.Ballot();
                    ballotEvent.watch(
                        function(err, result)
                        {
                            if (err)
                                return callback(err, null);

                            console.log('vote event: ', result.args.proposal.toNumber(), result.args.user);

                            return callback(null, transactionHash);
                        }
                    );

                    voteInstance.vote.sendTransaction(
                        proposal,
                        {
                            from: userAccount.address,
                            gas: 999999
                        },
                        function(err, tx)
                        {
                            if (err)
                                return console.log(err);

                            transactionHash = tx;
                        }
                    );
                }
            );
        }
    );
}

function vote(req, res, value)
{
    res.connection.setTimeout(0);
    
	Text.model.findById(req.params.id).exec(function(err, text)
	{
		if (err)
			return res.apiError('database error', err);
		if (!text)
			return res.apiError('not found');

		if (!TextHelper.textIsReadable(text, req))
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

                var age = Math.floor(
                    (Date.now() - new Date(req.user.birthdate)) / 1000
                    / (60 * 60 * 24) / 365.25
                );

				ballot = Ballot.model({
					text: text,
					voter: bcrypt.hashSync(req.user.sub, 10),
					value: value,
                    voterAge : age,
                    voterGender : req.user.gender
				});

                blockchainVote(
                    text.voteContractAdress,
                    ['yes', 'no', 'blank'].indexOf(value),
                    function(err, voteTransactionAddress)
                    {
                        if (err)
                            return res.apiError('blockchain error', err);

                        ballot.transactionAddress = voteTransactionAddress;

                        ballot.save(function(err)
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
	Text.model.findById(req.params.id).exec(function(err, text)
	{
		if (err)
			return res.apiError('database error', err);
		if (!text)
			return res.apiError('not found');

		if (!TextHelper.textIsReadable(text, req))
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
