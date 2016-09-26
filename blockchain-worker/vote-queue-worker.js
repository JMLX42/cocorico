var config = require('../api/config.json');
var keystone = require('../api/node_modules/keystone');
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var md5 = require('md5');
var bunyan = require('bunyan');

var log = bunyan.createLogger({name: "vote-queue-worker"});

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../api/dist/models');

var Vote = keystone.list('Vote');

function getCompiledVoteContract(web3, callback)
{
    var path = '/vagrant/contract/Vote.sol';
    var source = fs.readFileSync(path, {encoding: 'utf-8'});

    log.info(
      { path: path },
      'compiling smart contract'
    );

    web3.eth.compile.solidity(source, (error, compiled) => {
      if (!error) {
        log.info(
          { md5Hash: md5(source) },
          'compiled smart contract'
        );
      }

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

                log.info(
                    { address: accounts[0] },
                    'start mining contract'
                );

                web3.eth.contract(abi).new(
                    3, // num proposals
                    {
                        from: accounts[0],
                        data: code,
                        gas: 999999
                    },
                    (error, contract) => {
                        if (error) {
                            return callback(error, null, null);
                        }

                        if (!contract) {
                            return;
                        }

                        if (!contract.address) {
                            hash = contract.transactionHash
                        } else {
                            // tx mined
                            log.info(
                                {
                                    hash: hash,
                                    contractAddress: contract.address
                                },
                                'contract transaction mined'
                            );

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
    mineVoteContract((err, contract, abi) => {
        if (err) {
            return callback(err, null);
        }

        Vote.model.findById(vote.id)
            .exec((err, vote) => {
                if (err) {
                    return callback(err, null);
                }

                vote.status = 'open';
            	vote.voteContractABI = JSON.stringify(abi);
                vote.voteContractAddress = contract.address;

                vote.save(callback);
            });
    });
}

require('amqplib/callback_api').connect(
    'amqp://localhost',
    function(err, conn)
    {
        if (err != null) {
            return log.error({error: err}, 'error');
        }

        log.info('connecting');

        conn.createChannel(function(err, ch)
        {
            if (err != null) {
                return log.error({error: err}, 'error');
            }

            log.info('connected');

            ch.assertQueue('votes');
            ch.consume(
                'votes',
                (msg) =>{
                    if (msg !== null) {
                        var obj = JSON.parse(msg.content.toString());

                        log.info({ vote: obj }, 'vote received');

                        if (obj.vote) {
                            handleVote(obj.vote, (err, vote) => {
                                if (!!err) {
                                    log.error({error: err}, 'error');
                                    return ch.nack(msg);
                                }

                                return ch.ack(msg);
                            });
                        }
                    }
                });
        });
    }
);
