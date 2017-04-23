import keystone from '/opt/cocorico/api-web/node_modules/keystone';
import apiConfig from '/opt/cocorico/api-web/config.json';
import config from '/opt/cocorico/blockchain-worker/config.json';

import async from 'async';
import Web3 from 'web3';
import fs from 'fs';
import md5 from 'md5';
import amqplib from 'amqplib';
import solc from 'solc';

import cluster from 'cluster';
import Logger from 'cocorico-logger';

const logger = new Logger('vote-consumer-' + cluster.worker.id);

keystone.init({'mongo' : apiConfig.mongo.uri, headless: true});
keystone.mongoose.connect(apiConfig.mongo.uri);
keystone.import('../../../api/dist/models');

const Vote = keystone.list('Vote');

function getCompiledVoteContract(web3, callback) {
  var path = '/srv/cocorico/contract/Vote.sol';
  var source = fs.readFileSync(path, {encoding: 'utf-8'});

  logger.info(
    'compiling smart contract',
    { path: path },
  );

  var compiled = solc.compile(source, 1);
  var abi = JSON.parse(compiled.contracts[':Vote'].interface);
  var bin = '0x' + compiled.contracts[':Vote'].bytecode;

  logger.info(
    'compiled smart contract',
    {
      md5Hash: md5(source),
      abi: abi,
    },
  );

  callback(null, {abi: abi, bin: bin});
}

function mineVoteContract(numProposals, numChoices, next) {
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
        var code = compiled.bin;
        var abi = compiled.abi;
        var gasEstimate = '1999999';//web3.eth.estimateGas({data: code});

        logger.info(
          'start mining contract',
          { address: accounts[0] },
        );

        web3.eth.contract(abi).new(
          numProposals,
          numChoices,
          {
            from: accounts[0],
            data: code,
            gas: gasEstimate,
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
                  'contract transaction mined',
                  {
                    hash: hash,
                    contractAddress: contract.address,
                  },
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
  mineVoteContract(
    voteMsg.numProposals,
    voteMsg.numChoices,
    (err, contract, abi) => {
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
    }
  );
}

function handleMessage(ch, msg) {
  if (msg !== null) {
    var obj = JSON.parse(msg.content.toString());

    logger.info('vote received', { vote: obj });

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
}

var queue;
var channel;

export async function run() {
  try {
    logger.info('connecting to the queue');

    queue = await amqplib.connect(null, {heartbeat:30});

    logger.info('connected to the queue');

    channel = await queue.createChannel();
    channel.prefetch(config.voteConsumerPrefetch);

    logger.info('channel created, waiting for messages...');

    await channel.assertQueue('votes', {autoDelete: false, durable: true});
    channel.consume('votes', (message) => handleMessage(channel, message));
  } catch (err) {
    logger.error('queue error', {error : err});

    if (!!channel) {
      await channel.close();
    }

    if (!!queue) {
      await queue.close();
    }

    process.exit(1);
  }
}
