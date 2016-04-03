var config = require('../api/config.json');
var keystone = require('../api/node_modules/keystone');
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var md5 = require('md5');

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../api/models');

var Bill = keystone.list('Bill');

function whenTransactionMined(web3, tx, callback)
{
    async.during(
        function(callback)
        {
            web3.eth.getTransaction(
                tx,
                function(e, r)
                {
                    if (r && r.blockHash)
                        return callback(e, false, r);

                    return callback(e, true, null);
                }
            );
        },
        function(callback)
        {
            setTimeout(callback, 1000);
        },
        function(err, r)
        {
            callback(err, r);
        }
    );
}

function waitForBlockchain(callback)
{
    var errorLogged = false;

    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

    async.whilst(
        function()
        {
            var connected = web3.isConnected();

            if (!connected && !errorLogged)
                console.log({error : 'unable to connect to the blockchain'});
            if (connected && errorLogged)
                console.log({log : 'successfully connected to the blockchain'});

            return !connected;
        },
        function(callback)
        {
            setTimeout(callback, 5000);
        },
        function(err)
        {
            callback();
        }
    );
}

function getCompiledVoteContract(web3, callback)
{
    var source = fs.readFileSync('/vagrant/contract/Vote.sol', {encoding: 'utf-8'});

    web3.eth.compile.solidity(source, (error, compiled) => {
        if (!error)
            console.log({
                log: 'compiled Vote.sol smart contract',
                md5Hash: md5(source)
            });

        callback(error, compiled);
    });
}

function mineVoteContract(callback)
{
    var hash = '';
    var web3 = new Web3();

    web3.setProvider(new web3.providers.HttpProvider(
        "http://127.0.0.1:8545"
    ));

    async.waterfall(
        [
            (callback) => getCompiledVoteContract(web3, callback),
            (compiled, callback) => web3.eth.getAccounts(
                (err, accounts) => callback(err, accounts, compiled)
            ),
            (accounts, compiled, callback) => {
                var code = compiled.Vote.code;
                var abi = compiled.Vote.info.abiDefinition;

                console.log({log:'start mining contract', address:accounts[0]});

                web3.eth.contract(abi).new(
                    3, // num proposals
                    {
                        from: accounts[0],
                        data: code,
                        gas: 999999
                    },
                    function(error, contract)
                    {
                        if (error)
                            return callback(error, null, null);

                        if (!contract)
                            return;

                        if (!contract.address)
                        {
                            hash = contract.transactionHash
                        }
                        else
                        {
                            // tx mined
                            console.log({
                                log: 'contract transaction mined',
                                hash: hash,
                                contractAddress: contract.address
                            });

                            callback(null, contract, abi);
                        }
                    }
                );
            }
        ],
        callback
    );
}

function handleVote(vote, callback)
{
    mineVoteContract(function(err, contract, abi)
    {
        if (err)
            return callback(err, null);

        Bill.model.findById(vote.id)
            .exec(function(err, bill)
            {
                if (err)
                    return callback(err, null);

            	bill.voteContractABI = JSON.stringify(abi);
                bill.voteContractAddress = contract.address;

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

                        console.log({
                            log: 'vote received',
                            vote: obj
                        });

                        if (obj.vote)
                        {
                            handleVote(obj.vote, function(err, bill)
                            {
                                if (err)
                                    console.log({err: err});
                                else
                                    ch.ack(msg);
                            });
                        }
                    }
                });
        });
    }
);
