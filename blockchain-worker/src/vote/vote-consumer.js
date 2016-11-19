var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('/opt/cocorico/api-web/node_modules/keystone');
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var md5 = require('md5');

import cluster from 'cluster';
import Logger from 'cocorico-logger';

const logger = new Logger('vote-consumer-' + cluster.worker.id);

keystone.init({'mongo' : config.mongo.uri, headless: true});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../../../api/dist/models');

var Vote = keystone.list('Vote');

function getCompiledVoteContract(web3, callback) {
  var path = '/srv/cocorico/contract/Vote.sol';
  var source = fs.readFileSync(path, {encoding: 'utf-8'});

  logger.info(
    { path: path },
    'compiling smart contract'
  );

  web3.eth.compile.solidity(source, (error, compiled) => {
      if (error) {
          callback(error);
      } else {
          logger.info(
              { md5Hash: md5(source) },
              'compiled smart contract'
          );
          callback(null, !!compiled.Vote ? compiled.Vote : compiled);
      }
  });
}

function mineVoteContract(numCandidates, numProposals, next) {
  var hash = '';
  var web3 = new Web3();

  web3.setProvider(new web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
  ));

  async.waterfall(
    [
      (callback) => getCompiledVoteContract(web3, callback),
      (compiled, callback) => web3.eth.getAccounts(
        (err, accounts) => callback(err, accounts, compiled)
      ),
      (accounts, compiled, callback) => {
        var code = compiled.code;
        var abi = compiled.info.abiDefinition;

        logger.info(
          { address: accounts[0] },
          'start mining contract'
        );

        web3.eth.contract(abi).new(
          numCandidates,
          numProposals,
          {
            from: accounts[0],
            data: code,
            gas: 999999,
          },
          (error, contract) => {
            if (error) {
              callback(error, null, null);
              return;
            }

            if (!!contract) {
              if (!contract.address) {
                hash = contract.transactionHash
              } else {
                    // tx mined
                logger.info(
                  {
                    hash: hash,
                    contractAddress: contract.address,
                  },
                        'contract transaction mined'
                    );

                callback(null, contract, abi);
              }
            }
          }
        );
      },
    ],
    next
  );
}

function handleVote(voteMsg, callback) {
  mineVoteContract(voteMsg.numCandidates, voteMsg.numProposals, (err, contract, abi) => {
    if (err) {
      callback(err, null);
      return;
    }

    Vote.model.findById(voteMsg.id)
      .exec((findErr, vote) => {
        if (findErr) {
          callback(findErr, null);
          return;
        }

        // FIXME: should not fail silently
        if (!vote) {
          logger.error('unable to find/update Vote object');
          callback(null, null);
          return;
        }

        vote.status = 'open';
        vote.voteContractABI = JSON.stringify(abi);
        vote.voteContractAddress = contract.address;

        vote.save(callback);
      });
  });
}

module.exports.run = function() {
  require('amqplib/callback_api').connect(
      'amqp://localhost',
      (err, conn) => {
        if (err != null) {
          logger.error({error: err}, 'error');
          process.exit(1);
        }

        logger.info('connecting');

        conn.createChannel((channelErr, ch) => {
          if (channelErr != null) {
            logger.error({error: channelErr}, 'error');
            process.exit(1);
          }

          logger.info('connected');

          ch.assertQueue('votes');
          ch.consume(
            'votes',
            (msg) =>{
              if (msg !== null) {
                var obj = JSON.parse(msg.content.toString());

                logger.info({ vote: obj }, 'vote received');

                if (obj.vote) {
                  handleVote(obj.vote, (voteErr, vote) => {
                    if (!!voteErr) {
                      logger.error({error: voteErr}, 'error');
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
}
