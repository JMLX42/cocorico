import keystone from '/opt/cocorico/api-web/node_modules/keystone';
import apiConfig from '/opt/cocorico/api-web/config.json';
import config from '/opt/cocorico/blockchain-worker/config.json';

import cluster from 'cluster';
import amqplib from 'amqplib';
import EthereumTx from 'ethereumjs-tx';
import EthereumUtil from 'ethereumjs-util';
import promise from 'thenify';
import delay from 'timeout-as-promise';
import Web3 from 'web3';
import Logger from 'cocorico-logger';

import isValidBallotMessage from './isValidBallotMessage';
import watchContractEvents from './watchContractEvents';
import webhook from './webhook';
import noRetryError from './noRetryError';

keystone.init({'mongo' : apiConfig.mongo.uri, headless: true});
keystone.mongoose.connect(apiConfig.mongo.uri);
keystone.import('../../../api/dist/models');

const Ballot = keystone.list('Ballot');
const logger = new Logger('ballot-consumer-' + cluster.worker.id);

// the amount of ether given to each voter when calling Vote.registerVoter()
const VOTER_ACCOUNT_ETH_INIT = '20000000000000000';

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(
  'http://127.0.0.1:8545'
));

async function pushBackToQueueWithStep(channel, ballot, step) {
  await updateBallotStep(ballot, step);

  channel.sendToQueue(
    'ballots',
    new Buffer(JSON.stringify({ballot:ballot})),
    {persistent: true}
  );
}

async function updateBallotStatus(ballot, status) {
  ballot.status = status;
  await updateDatabaseBallot(ballot, {status: status});

  await webhook(ballot, status);

  logger.info('ballot status changed', {status: status});
}

async function updateBallotStep(ballot, step) {
  ballot.step = step;
  await updateDatabaseBallot(ballot, {step: step});

  logger.info('ballot step changed', {step: step});
}

async function getDatabaseBallot(ballot) {
  var ballotRecord = await Ballot.model.findById(ballot.id).exec();
  if (!ballotRecord) {
    throw noRetryError({error:'unknown ballot with id ' + ballot.id});
  }

  return ballotRecord;
}

async function saveBallotError(ballot, errorMessage) {
  var ballotRecord = await getDatabaseBallot(ballot);

  for (var error of ballotRecord.error) {
    if (error === errorMessage) {
      return ballotRecord;
    }
  }

  ballotRecord.error.push(errorMessage);

  return await ballotRecord.save();
}

async function updateDatabaseBallot(ballot, data) {
  var ballotRecord = await getDatabaseBallot(ballot);

  ballotRecord = Object.assign(ballotRecord, data);

  return await ballotRecord.save();
}

async function handleQueuedBallot(ballot) {
  logger.info('handling queued ballot');

  ballot.registeringStartBlockNumber = await promise((cb)=>web3.eth.getBlockNumber(cb))();

  const signedTx = new EthereumTx(ballot.transaction);
  const address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());
  const accounts = await promise((...c)=>web3.eth.getAccounts(...c))();
  const rootAccount = accounts[0];
  const contract = await promise((...c)=>web3.eth.contract(ballot.voteContractABI).at(...c))(
    ballot.voteContractAddress
  );

  logger.info(
    'preparing to call Vote.registerVoter()',
    {
      contract: contract.address,
      address: address,
    },
  );

  try {
    const txHash = await promise((...c)=>contract.registerVoter.sendTransaction(...c))(
      address,
      {
        from: rootAccount,
        gasLimit: 999999,
        gasPrice: 20000000000,
        value: VOTER_ACCOUNT_ETH_INIT,
      }
    );

    logger.info(
      'Vote.registerVoter() call transaction sent',
      {
        contract: contract.address,
        address: address,
        transactionHash: txHash,
      },
    );

  } catch (err) {
    if (err.message === 'Nonce too low'
        || err.message.indexOf('Known transaction:') === 0) {
      throw noRetryError({error:'rejected Vote.registerVoter() transaction'});
    }

    throw err;
  }
}

async function handleRegisteringBallot(ballot) {
  logger.info('handling registering ballot');

  const blockNumber = ballot.registeringStartBlockNumber;
  const signedTx = new EthereumTx(ballot.transaction);
  const address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());
  const contract = await promise((a, cb)=>web3.eth.contract(ballot.voteContractABI).at(a, cb))(
    ballot.voteContractAddress
  );
  const voterRegisteredEvent = contract.VoterRegistered(
    {voter: address},
    {fromBlock: blockNumber, toBlock: 'latest'}
  );
  const voteErrorEvent = contract.VoteError(
    {user: address},
    {fromBlock: blockNumber, toBlock: 'latest'}
  );

  logger.info('listening for Vote.registerVoter() events');

  const event = await watchContractEvents([voteErrorEvent], [voterRegisteredEvent]);

  logger.info('received Vote.registerVoter() event', {event:event});
}

async function handleRegisteredBallot(ballot) {
  logger.info('handling registered ballot');

  ballot.castingStartBlockNumber = await promise((cb)=>web3.eth.getBlockNumber(cb))();

  const signedTx = new EthereumTx(ballot.transaction);
  const address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());
  const contract = await promise((a, cb)=>web3.eth.contract(ballot.voteContractABI).at(a, cb))(
    ballot.voteContractAddress
  );

  logger.info(
    'preparing to call Vote.vote()',
    {
      contract: contract.address,
      address: address,
    },
  );

  try {
    const txHash = await promise((tx, cb)=>web3.eth.sendRawTransaction(tx, cb))(
      ballot.transaction
    );

    logger.info(
      'Vote.vote() call transaction sent',
      {
        contract: contract.address,
        address: address,
        transactionHash: txHash,
      },
    );

  } catch (err) {
    if (err.message === 'Nonce too low'
        || err.message.indexOf('Known transaction:') === 0) {
      throw noRetryError({error:'rejected Vote.vote() transaction'});
    }

    throw err;
  }
}

async function handleCastingBallot(ballot) {
  logger.info('handling casting ballot');

  const blockNumber = ballot.castingStartBlockNumber;
  const signedTx = new EthereumTx(ballot.transaction);
  const address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());
  const contract = await promise((a, cb)=>web3.eth.contract(ballot.voteContractABI).at(a, cb))(
    ballot.voteContractAddress
  );
  const ballotEvent = contract.Ballot(
    {voter: address},
    {fromBlock: blockNumber, toBlock: 'latest'}
  );
  const voteErrorEvent = contract.VoteError(
    {user: address},
    {fromBlock: blockNumber, toBlock: 'latest'}
  );

  logger.info('listening for Vote.vote() events');

  const event = await watchContractEvents([voteErrorEvent], [ballotEvent]);

  logger.info('received Vote.vote() event', {event: event});
}

async function handleMessage(channel, message) {
  const messageData = JSON.parse(message.content.toString());

  logger.info('message received', {data: messageData});

  if (!isValidBallotMessage(messageData)) {
    logger.info('invalid ballot message: ignoring')
    channel.ack(message);
    return ;
  }

  const ballot = messageData.ballot;

  if (!ballot.step) {
    ballot.step = 'queued';
  }

  try {
    switch (ballot.step) {
      case 'queued':
        await handleQueuedBallot(ballot);
        await pushBackToQueueWithStep(channel, ballot, 'registering');
        channel.ack(message);
        break;
      case 'registering':
        await handleRegisteringBallot(ballot);
        await pushBackToQueueWithStep(channel, ballot, 'registered');
        channel.ack(message);
        break;
      case 'registered':
        await handleRegisteredBallot(ballot);
        await pushBackToQueueWithStep(channel, ballot, 'casting');
        channel.ack(message);
        break;
      case 'casting':
        await handleCastingBallot(ballot);
        await updateBallotStep(ballot, 'complete');
        await updateBallotStatus(ballot, 'success');
        channel.ack(message);
        break;
      case 'complete':
      default:
        // should never happen
        // channel.ack(message);
    }
  } catch (err) {
    var errorMessage = err instanceof Error
      ? err.stack
      : JSON.stringify(err);

    logger.error({error: errorMessage});

    if (!errorMessage || errorMessage === '{}') {
      errorMessage = 'unknown error';
    }

    await saveBallotError(ballot, errorMessage);
    await updateBallotStatus(ballot, 'error');

    if (err.noRetry) {
      channel.ack(message);
    } else {
      channel.nack(message);
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
    channel.prefetch(config.ballotConsumerPrefetch);

    logger.info('channel created, waiting for messages...');

    await channel.assertQueue('ballots', {autoDelete: false, durable: true});
    channel.consume('ballots', (message) => handleMessage(channel, message));
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
