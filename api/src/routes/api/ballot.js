var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var async = require('async');

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
        (err, msg) => callback(err, ballot)
      ),
    ],
    (err, ballot) => {
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
      return res.apiResponse({ballot: ballot});
    }
  );
}

// exports.cancel = function(req, res) {
//   if (!config.capabilities.vote.vote)
//     return res.status(403).send();

  // Vote.model.findById(req.params.id).exec(function(err, vote)
  // {
  //   if (err)
  //     return res.apiError('database error', err);
  //   if (!vote)
  //     return res.apiError('not found');
    //
  //   BallotHelper.getByVoteIdAndVoter(
  //     req.params.id,
  //     req.user.sub,
  //     function(err, ballot)
  //     {
  //       if (err)
  //         return res.apiError('database error', err);
    //
  //       if (!ballot)
  //         return res.status(404).apiResponse({
  //           error: 'ballot does not exist'
  //         });
    //
  //       Ballot.model.findById(ballot.id).remove(function(err)
  //       {
  //         var client = redis.createClient();
  //         var key = 'ballot/' + req.params.id + '/' + req.user.sub;
    //
  //         if (err)
  //           return res.apiError('database error', err);
    //
  //         client.on('connect', function()
  //         {
  //           client.del(key, function(err, reply)
  //           {
  //             if (err)
  //               console.log(err);
    //
  //             return res.apiResponse({ ballot: 'removed' });
  //           });
  //         });
  //       });
  //     });
  // });
// }
