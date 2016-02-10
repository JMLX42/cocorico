var keystone = require('../api/node_modules/keystone');
var config = require('../api/config.json');

var EthereumAccounts = require('ethereumjs-accounts');
var HookedWeb3Provider = require("hooked-web3-provider");
var Web3 = require('web3');

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../api/models');

var Text = keystone.list('Text');

function whenTransactionMined(web3, tx, callback)
{
    var check = setInterval(
        function()
        {
            web3.eth.getTransaction(
                tx,
                function(e, r)
                {
                    if (e || (r && r.blockHash))
                    {
                        clearInterval(check);
                        callback(e, r);
                    }
                }
            );
        },
        1000
    );
}

function waitForBlockchain(callback)
{
    var errorLogged = false;
    var i = setInterval(
        function()
        {
            var web3 = new Web3();
            web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

            if (web3.isConnected())
            {
                if (errorLogged)
                    console.log({log : 'successfully connected to the blockchain'});

                clearInterval(i);
                return callback();
            }
            else if (!errorLogged)
            {
                console.log({error : 'unable to connect to the blockchain'});
                errorLogged = true;
            }
        },
        5000
    );
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

function handleVote(vote, callback)
{
    mineVoteContract(function(err, res)
    {
        Text.model.findById(vote.id)
            .exec(function(err, bill)
            {
                if (err)
                    return callback(err, null);

                bill.voteContractAddress = res.address;

                bill.save(function(err, bill)
                {
                    if (err)
                        return callback(err, null);

                    callback(null, bill);
                });
            });
    });
}

require('amqplib/callback_api').connect(
    'amqp://localhost',
    function(err, conn)
    {
        if (err != null)
            return console.error(err);

        conn.createChannel(function(err, ch)
        {
            if (err != null)
                return console.error(err);

            ch.assertQueue('pending-votes');
            ch.consume(
                'pending-votes',
                function(msg)
                {
                    if (msg !== null)
                    {
                        var obj = JSON.parse(msg.content.toString());

                        console.log('consume', obj);

                        if (obj.vote)
                        {
                            handleVote(obj.vote, function(err, bill)
                            {
                                console.log('produce', bill);
                                ch.ack(msg);
                            });
                        }
                    }
                });
        });
    }
);
