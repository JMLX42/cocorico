var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var async = require('async');
var jwt = require('jsonwebtoken');

var Vote = keystone.list('Vote');

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
          transaction: req.body.transaction,
          voteContractAddress: vote.voteContractAddress,
          voteContractABI: JSON.parse(vote.voteContractABI),
        },
        (err, msg) => callback(err, vote, ballot)
      ),
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
          return res.apiError(err.error);
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

  // We fetch the vote that match the smart contract address.
  Vote.findOne({voteContractAddress: decoded.c})
    .exec((findErr, vote) => {
      if (err) {
        return res.apiError('database error', err);
      }

      if (!vote) {
        return res.status(404).apiResponse({error: 'vote does not exist'});
      }

      return jwt.verify(
        req.body.proofOfVote,
        vote.key,
        (err, verified) => {
          if (err) {
            return res.status(400).apiResponse({error: err.message});
          }



          return res.status(200).send();
        });
    });
}
