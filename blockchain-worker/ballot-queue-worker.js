var keystone = require('../api/node_modules/keystone');
var config = require('../api/config.json');

var EthereumAccounts = require('ethereumjs-accounts');
var HookedWeb3Provider = require("hooked-web3-provider");
var Web3 = require('web3');

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../api/models');

var Ballot = keystone.list('Ballot');

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
            whenTransactionMined(
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

            console.log('block', block.hash);

            var transactionHash = '';
            var Vote = require('/opt/cocorico/blockchain/Vote.json');
            var voteContract = web3.eth.contract(eval(Vote.contracts.Vote.abi));
            var voteInstance = voteContract.at(
                voteContractAdress,
                function(err, voteInstance)
                {
                    if (err)
                        return callback(err, null);

                    console.log('contract at', voteContractAdress);

                    var ballotEvent = voteInstance.Ballot();
                    ballotEvent.watch(
                        function(err, result)
                        {
                            if (err)
                                return callback(err, null);

                            if (result.args.user == userAccount.address)
                            {
                                console.log('vote event: ', result.args.proposal.toNumber(), result.args.user);
                                return callback(null, transactionHash);
                            }
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
                                return callback(err, null);

                            transactionHash = tx;

                            console.log('tx', tx);
                        }
                    );
                }
            );
        }
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

function handleBallot(ballot, callback)
{
    waitForBlockchain(function()
    {
        blockchainVote(
            ballot.voteContractAddress,
            ['yes', 'blank', 'no'].indexOf(ballot.value),
            function(err, tx)
            {
                console.log(ballot.id, '@', tx);
                Ballot.model.findById(ballot.id)
                    .exec(function(err, dbBallot)
                    {
                        if (err)
                            return callback(err, null);

                        dbBallot.transactionAddress = tx;
                        dbBallot.status = 'complete';

                        dbBallot.save(function(err, dbBallot)
                        {
                            return callback(null, dbBallot);
                        });
                    });
            }
        );
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

            ch.assertQueue('pending-ballots');
            ch.consume(
                'pending-ballots',
                function(msg)
                {
                    if (msg !== null)
                    {
                        var obj = JSON.parse(msg.content.toString());

                        if (obj.ballot)
                        {
                            handleBallot(obj.ballot, function(err, ballot)
                            {
                                ch.ack(msg);
                            });
                        }
                    }
                });
        });
    }
);
