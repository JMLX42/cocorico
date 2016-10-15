var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('/opt/cocorico/api-web/node_modules/keystone');
var async = require('async');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var Web3 = require('web3');
var bunyan = require('bunyan');
var cluster = require('cluster');

var log = bunyan.createLogger({name: 'ballot-consumer-' + cluster.worker.id});

keystone.init({'mongo' : config.mongo.uri});
keystone.mongoose.connect(config.mongo.uri);
keystone.import('../../api/dist/models');

var Ballot = keystone.list('Ballot');

function noRetryError(err) {
  if (!!err) {
    err.noRetry = true;
  }

  return err;
}

function whenTransactionMined(web3, tx, callback) {
  async.during(
    function(cb) {
      web3.eth.getTransaction(
        tx,
        function(e, r) {
          if (r && r.blockHash)
            return cb(e, false, r);

          return cb(e, true, null);
        }
      );
    },
    function(cb) {
      setTimeout(cb, 1000);
    },
    function(err, r) {
      callback(err, r);
    }
  );
}

function initializeVoterAccount(web3, rootAccount, address, callback) {
  var value = '30000000000000000';

  log.info(
    {
      from : rootAccount,
      value : value,
      address : address,
    },
    'initialize account'
  );

  web3.eth.sendTransaction(
    {
      from: rootAccount,
      to: address,
      value: value,
    },
    function(error, result) {
      whenTransactionMined(
        web3,
        result,
        function(err, block) {
          if (err)
            return callback(err, null);

          log.info(
            {
              from : rootAccount,
              value : value,
              address: address,
              balance: web3.eth.getBalance(address),
            },
            'account initialized'
          );

          return callback(null, block);
        }
      );
    }
  );
}

function registerVoter(web3, rootAccount, address, voteInstance, callback) {
  var voterRegisteredEvent = voteInstance.VoterRegistered();
  var voteErrorEvent = voteInstance.VoteError();

  voterRegisteredEvent.watch((err, e) => {
    if (e.args.voter === address) {
      voterRegisteredEvent.stopWatching();
      voteErrorEvent.stopWatching();
      callback(noRetryError(err), e);
    }
  });

  voteErrorEvent.watch((err, e) => {
    if (e.args.voter === address) {
      voteErrorEvent.stopWatching();
      voterRegisteredEvent.stopWatching();
      callback(noRetryError(err), e);
    }
  });

  voteInstance.registerVoter.sendTransaction(
    address,
    {
      from: rootAccount,
      gasLimit: 999999,
      gasPrice: 20000000000,
    },
    function(err, txhash) {
      if (err) {
        voteErrorEvent.stopWatching();
        voterRegisteredEvent.stopWatching();
        callback(err, null, null);
      } else {
        log.info(
          {
            contract: voteInstance.address,
            address: address,
            transactionHash: txhash,
          },
          'Vote.registerVoter function call transaction sent'
        );
      }
    }
  );
}

function sendVoteTransaction(web3, voteInstance, transaction, callback) {
  var ballotEvent = voteInstance.Ballot();
  var signedTx = new EthereumTx(transaction);
  var address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());

  ballotEvent.watch((err, e) => {
    if (e.args.voter === address) {
      ballotEvent.stopWatching();
      callback(err, e);
    }
  });

  web3.eth.sendRawTransaction(
    transaction,
    function(err, txhash) {
      if (err) {
        ballotEvent.stopWatching();
        callback(err, null, null);
      } else {
        log.info(
          {
            contract: voteInstance.address,
            address: address,
            transactionHash: txhash,
          },
          'Vote.vote function call transaction sent'
        );
      }
    }
  );
}

// function waitForBlockchain(web3, callback) {
//   var errorLogged = false;
//
//   async.whilst(
//     function() {
//       var connected = web3.isConnected();
//
//       if (!connected && !errorLogged) {
//         log.error('unable to connect to the blockchain');
//         errorLogged = true;
//       }
//       if (connected && errorLogged)
//         log.info('successfully connected to the blockchain');
//
//       return !connected;
//     },
//     function(cb) {
//       setTimeout(cb, 5000);
//     },
//     function(err) {
//       callback();
//     }
//   );
// }

function handleBallot(ballot, next) {
  if (!ballot.id) {
    next(noRetryError({error:'missing ballot id'}), null);
    return;
  }

  if (!ballot.voteContractAddress) {
    next(noRetryError({error:'missing ballot vote contract address'}), null);
    return;
  }

  if (!ballot.transaction) {
    next(noRetryError({error:'missing ballot transaction'}), null);
    return;
  }

  var web3 = new Web3();
  // FIXME: read URI from the config
  web3.setProvider(new web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
  ));

  var signedTx = new EthereumTx(ballot.transaction);
  var address = EthereumUtil.bufferToHex(signedTx.getSenderAddress());
  var rootAccount = null;

  async.waterfall(
    [
      (callback) => updateBallotStatus(
        ballot,
        'pending',
        (err, dbBallot) => callback(err)
      ),
      // Step 0: we make sure the ballot account is a new account.
      // Each account is unique: one vote => one account => one address. If
      // the address already has some funds, then it was used before and
      // something fishy is happening:
      // 1) someone is tempering with the platform; or
      // 2) the worker stopped/crashed after initializing the account but
      // before sending the vote transaction to the blockchain: not cool, but
      // it's safer to throw an error and ask the user to vote again.
      // (callback) => accountIsNotInitialized(web3, address, callback),
      (callback) => web3.eth.getAccounts((err, acc) => {
        rootAccount = acc[0];
        callback(err);
      }),
      // Step 1: we wait for the blockchain to be available.
      // (callback) => waitForBlockchain(web3, () => callback()),
      // Step 2: the voter account will need some ether to vote. So
      // the "root" account will make a first transaction to the voter
      // account to initialize it.
      (callback) => initializeVoterAccount(
        web3,
        rootAccount,
        address,
        callback
      ),
      (block, callback) => updateBallotStatus(
        ballot,
        'initialized',
        (err, dbBallot) => callback(err)
      ),
      // Step 3 : we fetch the vote contract instance from the blockchain.
      (callback) => web3.eth.contract(ballot.voteContractABI).at(
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
        rootAccount,
        address,
        voteInstance,
        (err, event) => callback(err, voteInstance)
      ),
      (voteInstance, callback) => updateBallotStatus(
        ballot,
        'registered',
        (err, dbBallot) => callback(err, voteInstance)
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
      // database Ballot status field..
      (event, callback) => {
        log.info(
          {
            balance: web3.eth.getBalance(address).toString(),
            event: event,
          },
          'ballot event'
        );

        updateBallotStatus(ballot, 'complete', callback);
      },
    ],
    next
  );
}

function updateBallotStatus(ballot, status, callback) {
  Ballot.model.findById(ballot.id)
    .exec(function(err, dbBallot) {
      if (err)
        return callback(err, null);

      if (!dbBallot) {
        return callback('unknown ballot with id ' + ballot.id, null);
      }

      dbBallot.status = status;

      return dbBallot.save(callback);
    });
}

function ballotError(ballot, msg, callback) {
  log.error(msg.toString());

  Ballot.model.findById(ballot.id)
    .exec(function(err, dbBallot) {
      if (err)
        return callback(err, null);

      if (dbBallot) {
        dbBallot.status = 'error';
        dbBallot.error = JSON.stringify(msg);

        return dbBallot.save(function(saveErr) {
          return callback(saveErr, dbBallot);
        });
      }

      return callback(null, null);
    });
}

module.exports.run = function() {
  log.info('connecting');

  require('amqplib/callback_api').connect(
    'amqp://localhost',
    (err, conn) => {
      if (err != null) {
        log.error({error: err}, 'error');
        process.exit(1);
      }

      log.info('connected');

      conn.createChannel((channelErr, ch) => {
        if (channelErr != null) {
          log.error({error: channelErr}, 'error');
          process.exit(1);
        }

        ch.assertQueue('ballots');
        ch.consume(
          'ballots',
          (msg) => {
            var msgObj = JSON.parse(msg.content.toString());

            if (!!msgObj.lastTriedAt && Date.now() / 1000 - msgObj.lastTriedAt < 1) {
              ch.nack(msg);
              return;
            }

            if (!msgObj.ballot) {
              log.info('invalid ballot message received');
              ch.ack(msg);
              return
            }

            log.info(
              {
                ballot : {
                  transaction: msgObj.ballot.transaction,
                  voteContractAddress: msgObj.ballot.voteContractAddress,
                  voteContractABI: msgObj.ballot.voteContractABI,
                },
              },
              'ballot received'
            );

            handleBallot(msgObj.ballot, (ballotErr, ballot) => {
              if (ballotErr) {
                log.error({error: ballotErr}, 'error');

                msgObj.lastTriedAt = Date.now() / 1000;

                ballotError(msgObj.ballot, ballotErr, () => {
                  if (ballotErr.noRetry) {
                    ch.ack(msg);
                    return;
                  }

                  ch.sendToQueue(
                    'ballots',
                    new Buffer(JSON.stringify(msgObj)),
                    { persistent : true }
                  );
                  ch.ack(msg);
                });
              }

              ch.ack(msg);
            });
          }
        );
      });
    }
  );
}
