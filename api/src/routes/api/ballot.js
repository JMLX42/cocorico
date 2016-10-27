var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var async = require('async');
var jwt = require('jsonwebtoken');
var Web3 = require('web3');

var Vote = keystone.list('Vote'),
  VerifiedBallot = keystone.list('VerifiedBallot');

exports.get = function(req, res) {
  Vote.model.findById(req.params.voteId).exec((voteErr, vote) => {
    if (voteErr) {
      return res.apiError('database error', voteErr)
    }

    if (!vote) {
      return res.status(404).apiResponse({error: 'vote does not exist'});
    }

    return vote.getBallotByUserUID(
      req.user.sub,
      (err, ballot) => {
        if (err) {
          return res.apiError('database error', err);
        }

        if (!ballot) {
          return res.status(404).apiResponse({
            error: 'ballot does not exist',
          });
        }

        return res.apiResponse({ ballot: ballot });
      }
    );
  });
}

function pushBallotMessageOnQueue(data, callback) {
  try {
    return require('amqplib/callback_api').connect(
      'amqp://localhost',
      (err, conn) => {
        if (err != null)
          return callback(err, null);

        return conn.createChannel((channelErr, ch) => {
          if (channelErr != null)
            return callback(channelErr, null);

          var ballotObj = { ballot : data };

          ch.assertQueue('ballots');
          ch.sendToQueue(
            'ballots',
            new Buffer(JSON.stringify(ballotObj)),
            { persistent : true }
          );

          ch.close();

          conn.close();

          return callback(null, ballotObj);
        });
      }
    );
  } catch (e) {
    return callback(e, null);
  }
}

function ballotTransactionError(res, ballot, msg) {
  ballot.status = 'error';
  ballot.error = JSON.stringify(msg);
  ballot.save((err) => {
    if (err)
      return res.apiError('database error', err);

    return res.status(400).send({error:msg});
  });
}

exports.vote = function(req, res) {
  if (!config.capabilities.vote.enabled)
    return res.status(403).send();

  var signedTx = new EthereumTx(req.body.transaction);
  var voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

  return async.waterfall(
    [
      (callback) => Vote.model.findById(req.params.voteId)
        .populate('app')
        .exec(callback),
      (vote, callback) => {
        if (!vote)
          return callback({code: 404, error: 'vote not found'});
        // FIXME: log the unauthorized attempt
        if (!vote.userIsAuthorizedToVote(req.user))
          return callback({code: 403, error: 'unauthorized user'});
        if (vote.voteContractAddress !== voteContractAddress)
          return callback({code: 300, error: 'contract address mismatch'});

        return vote.getBallotByUserUID(
          req.user.sub,
          (err, ballot) => callback(err, vote, ballot)
        );
      },
      (vote, ballot, callback) => {
        if (!!ballot)
          return callback({code: 403, error: 'user already voted'});

        return vote.createBallot(req.user.sub)
          .save((err, newBallot) => callback(err, vote, newBallot));
      },
      (vote, ballot, callback) => pushBallotMessageOnQueue(
        {
          id: ballot.id,
          app: vote.app,
          vote: {id: vote.id},
          user: {sub: req.user.sub},
          status: ballot.status, // queued
          transaction: req.body.transaction,
          voteContractAddress: vote.voteContractAddress,
          voteContractABI: JSON.parse(vote.voteContractABI),
        },
        (err, msg) => callback(err, vote, ballot)
      ),
      (vote, ballot, callback) => {
        vote.numBallots += 1;
        vote.save((err) => callback(err, vote, ballot));
      },
    ],
    (err, vote, ballot) => {
      if (err) {
        if (ballot) {
          return ballotTransactionError(res, ballot, err);
        }
        if (err.code) {
          res.status(err.code);
        }
        if (err.error) {
          return res.apiResponse({error: err.error});
        }
        return res.apiError(err);
      }

      return res.apiResponse({
        ballot: ballot,
        proof: vote.getProofOfVote(signedTx),
      });
    }
  );
}

exports.verify = function(req, res) {
  if (!req.body.proofOfVote) {
    res.status(400).send();
    return;
  }

  // First, we decode the JWT without checking the signature because we need
  // to get the vote smart contract address from the payload.
  var decoded = jwt.decode(req.body.proofOfVote);

  if (!decoded) {
    res.status(400).send();
    return;
  }

  VerifiedBallot.model.findOne({voterAddress: '0x' + decoded.a})
    .exec((findErr, ballot) => {
      if (findErr) {
        res.apiError('database error', err);
        return;
      }

      if (!!ballot) {
        res.apiResponse({verified: ballot});
        return;
      }

      var web3 = new Web3();
      web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

      async.waterfall(
        [
          // We fetch the vote that match the smart contract address.
          (callback) => Vote.model
            .findOne({voteContractAddress: '0x' + decoded.c})
            .exec(callback),
          // If the vote does not exist => 404
          // Otherwise, we verify the JWT
          (vote, callback) => !vote
            ? callback({code: 404, msg: 'vote does not exist'})
            : jwt.verify(
              req.body.proofOfVote,
              vote.key,
              (err, verified) => callback(err, vote, verified)
            ),
          // If the JWT is verified, we find the corresponding smart contract
          // instance.
          (vote, verified, callback) => web3.eth
            .contract(JSON.parse(vote.voteContractABI))
            .at(
              vote.voteContractAddress,
              (err, instance) => callback(err, vote, verified, instance)
            ),
          // We fetch the ballot events that match the voter address.
          (vote, verified, instance, callback) => instance
            .Ballot(
              {voter: '0x' + verified.a},
              {fromBlock:0, toBlock: 'latest'}
            )
            .get((err, transactions) => callback(
              err, vote, verified, transactions
            )),
          // We create the corresponding VerifiedBallot and we save it.
          (vote, verified, transactions, callback) => {
            var valid = !!transactions[0] && !!transactions[0].args
              && parseInt(transactions[0].args.proposal) === verified.p;

            VerifiedBallot
              .model({
                vote: vote,
                valid: valid,
                transactionHash: valid ? transactions[0].transactionHash : '',
                voterAddress: '0x' + verified.a,
              })
              .save((err, verifiedBallot) => callback(
                err, vote, verifiedBallot
              ))
          },
          // Update the Vote counters.
          (vote, verifiedBallot, callback) => {
            if (verifiedBallot.valid) {
              vote.numValidBallots += 1;
            } else {
              vote.numInvalidBallots += 1;
            }
            vote.save((err) => callback(err, verifiedBallot))
          },
        ],
        (err, verifiedBallot) => {
          if (err) {
            return res.status(err.code ? err.code : 400)
              .apiResponse({error: err.msg ? err.msg : err});
          } else {
            return res.apiResponse({
              verified: verifiedBallot,
            });
          }
        }
      );
    });
}

exports.getTransactions = function(req, res) {
  var voteId = req.params.voteId;

  return Vote.model.findById(voteId)
    .exec((err, vote) => {
      if (err) {
        return res.apiError('database error', err);
      }

      if (!vote) {
        return res.status(404).send();
      }

      if (vote.status !== 'complete') {
        return res.status(403).send();
      }

      var filter = null;

      if (!!req.body.transactionHash) {
        if (req.body.transactionHash.indexOf('0x') !== 0) {
          req.body.transactionHash = '0x' + req.body.transactionHash;
        }
        filter = (tx) => tx.transactionHash.indexOf(req.body.transactionHash) === 0;
      } else if (!!req.body.voter) {
        if (req.body.voter.indexOf('0x') !== 0) {
          req.body.voter = '0x' + req.body.voter;
        }
        filter = (tx) => tx.args.voter.indexOf(req.body.voter) === 0;
      } else if (!!req.body.proposal) {
        filter = (tx) => Math.round(tx.args.proposal.toNumber()) === parseInt(req.body.proposal);
      }

      var web3 = new Web3();
      web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

      return web3.eth.contract(JSON.parse(vote.voteContractABI))
        .at(
          vote.voteContractAddress,
          (atErr, instance) => {
            if (atErr) {
              return res.apiError('blockchain error', atErr);
            }

            var ballotEvent = instance.Ballot(null, {fromBlock:0, toBlock: 'latest'});
            return ballotEvent.get((ballotEventErr, result) => {
              if (ballotEventErr) {
                res.apiError('blockchain error', ballotEventErr);
                return;
              }

              var numItems = result.length;

              if (!!filter) {
                result = result.filter(filter);
              }

              var page = !req.body.page ? 0 : parseInt(req.body.page);
              var numPages = Math.ceil(result.length / 10);
              result = result.slice(page * 10, page * 10 + 10);

              VerifiedBallot.model.find({
                transactionHash: {$in: result.map((r)=>r.transactionHash)}}
              ).exec((findErr, ballots) => {
                for (var ballot of ballots) {
                  for (var tx of result) {
                    if (tx.transactionHash === ballot.transactionHash) {
                      tx.verified = ballot.valid;
                    }
                  }
                }

                res.apiResponse({
                  numItems: numItems,
                  page: page,
                  numPages: numPages,
                  transactions: result,
                });
              });
            });
          }
        );

    });
}
