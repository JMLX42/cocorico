var config = require('../api/config.json');
var keystone = require('../api/node_modules/keystone');
var async = require('async');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var Web3 = require('web3');
var bunyan = require('bunyan');

var log = bunyan.createLogger({name: "ballot-queue-worker"});

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../api/models');

var Ballot = keystone.list('Ballot');

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

function initializeVoterAccount(address, callback)
{
    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

    var value = '20000000000000000';
    var from = web3.eth.accounts[0];

    log.info(
        {
            from : from,
            value : value,
            address : address
        },
        'initialize account'
    );

    if (web3.eth.getBalance(address) != 0)
    {
        // Each account is unique: one vote => one account => one address. If
        // the address already has some funds, then it was used before and
        // something fishy is happening:
        // 1) someone is tempering with the platform; or
        // 2) the worker stopped/crashed after initializing the account but
        // before sending the vote transaction to the blockchain: not cool, but
        // it's safer to throw an error and ask the user to vote again.
        return callback('account already initialized', null);
    }

    web3.eth.sendTransaction(
        {
            from: from,
            to: address,
            value: value
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

                    log.info(
                        {
                            address : address,
                            balance: web3.eth.getBalance(address).toString()
                        },
                        'account initialized'
                    );

                    return callback(null, block);
                }
            );
        }
    );
}

function getVoteContractInstance(web3, abi, address, callback)
{
    var voteContract = web3.eth.contract(abi);
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

function registerVoter(web3, address, voteInstance, callback)
{
    var voteRegisteredEvent = voteInstance.VoterRegistered();

    voteRegisteredEvent.watch((err, e) => {
        if (e.args.voter == address)
            callback(err, e);
    });

    voteInstance.registerVoter.sendTransaction(
        address,
        {
            from: web3.eth.accounts[0],
            gasLimit: 999999,
            gasPrice: 20000000000,
        },
        function(err, txhash)
        {
            if (err)
                return callback(err, null, null);

            log.info(
                {
                    contract: voteInstance.address,
                    address: address,
                    transactionHash: txhash,
                    balance: web3.eth.getBalance(address).toString()
                },
                'Vote.registerVoter function call transaction sent'
            );
        }
    );
}

function sendVoteTransaction(web3, voteInstance, transaction, callback)
{
    var ballotEvent = voteInstance.Ballot();
    var signedTx = new EthereumTx(transaction);
    var address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());

    ballotEvent.watch((err, e) => {
        if (e.args.voter == address)
            callback(err, e);
    });

    web3.eth.sendRawTransaction(
        transaction,
        function(err, txhash)
        {
            if (err)
                return callback(err, null, null);

            log.info(
                {
                    contract: voteInstance.address,
                    address: address,
                    transactionHash: txhash,
                    balance: web3.eth.getBalance(address).toString()
                },
                'Vote.vote function call transaction sent'
            );
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
            {
                log.error('unable to connect to the blockchain');
                errorLogged = true;
            }
            if (connected && errorLogged)
                log.info('successfully connected to the blockchain');

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

function handleBallot(ballot, callback)
{
    if (!ballot.id || !ballot.voteContractAddress || !ballot.transaction)
        return callback('invalid ballot', null);

    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

    var signedTx = new EthereumTx(ballot.transaction);
    var address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());

    async.waterfall(
        [
            // Step 1: we wait for the blockchain to be available.
            (callback) => waitForBlockchain(() => callback(null)),
            // Step 2: the voter account will need some ether to vote. So
            // the "root" account will make a first transaction to the voter
            // account to initialize it.
            (callback) => initializeVoterAccount(address, callback),
            // Step 3 : we fetch the vote contract instance from the blockchain.
            (block, callback) => getVoteContractInstance(
                web3,
                ballot.voteContractABI,
                ballot.voteContractAddress,
                callback
            ),
            // Step 4: the "root" account must authorize the voter account to
            // vote. If having enough ether was the only required condition to
            // vote, then anyone mining on the blockchain could create accounts
            // and vote. To avoid this:
            // * only registered accounts can vote ;
            // * only the account that instanciated the vote contract can
            //   register accounts.
            // * vote contracts macthing actual bills an only be instanciated
            //   being the scenes by the API by the root account.
            (voteInstance, callback) => registerVoter(
                web3,
                address,
                voteInstance,
                (err, event) => callback(err, voteInstance)
            ),
            // Step 5: we call the Vote.vote() contract function by sending
            // the raw transaction built/signed by the client app. We also
            // start listening to the Ballot event to know when the vote has
            // actually been successfully recorded on the blockchain.
            (voteInstance, callback) => sendVoteTransaction(
                web3,
                voteInstance,
                ballot.transaction,
                callback
            ),
            // Step 6: the Ballot event has been emitted => the vote has been
            // recorded on the blockchain. We need to update the corresponding
            // database Ballot object but first we have to find it.
            (event, callback) => {
                log.info(
                    {
                        balance: web3.eth.getBalance(address).toString(),
                        event: event
                    },
                    'ballot event'
                );

                Ballot.model.findById(ballot.id).exec(callback);
            },
            // Step 7: update the Ballot.status field in the database.
            (dbBallot, callback) => {
                if (!dbBallot)
                    return callback('unknown ballot with id ' + ballot.id, null);

                dbBallot.status = 'complete';

                dbBallot.save(callback);
            }
        ],
        callback
    );
}

function ballotError(ballot, msg, callback)
{
    log.error(msg.toString());

    Ballot.model.findById(ballot.id)
        .exec(function(err, dbBallot)
        {
            if (err)
                return callback(err, null);

            if (dbBallot)
            {
                dbBallot.status = 'error';
                dbBallot.error = JSON.stringify(msg);

                dbBallot.save(function(err, dbBallot)
                {
                    return callback(null, dbBallot);
                });
            }
            else
                return callback(null, null);
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

            ch.assertQueue('ballots');
            ch.consume(
                'ballots',
                function(msg)
                {
                    if (msg !== null)
                    {
                        var msgObj = JSON.parse(msg.content.toString());

                        // return ch.ack(msg);

                        if (msgObj.ballot)
                        {
                            handleBallot(msgObj.ballot, function(err, ballot)
                            {
                                if (err)
                                    return ballotError(msgObj.ballot, err, function() {ch.ack(msg)});

                                ch.ack(msg);
                            });
                        }
                    }
                });
        });
    }
);
