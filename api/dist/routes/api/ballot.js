'use strict';

var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var EthereumTx = require('ethereumjs-tx');
var EthereumUtil = require('ethereumjs-util');
var async = require('async');

var Vote = keystone.list('Vote'),
    Ballot = keystone.list('Ballot');

exports.get = function (req, res) {
  Ballot.getByVoteIdAndUser(req.params.voteId, req.user.sub, function (err, ballot) {
    if (err) return res.apiError('database error', err);

    if (!ballot) return res.status(404).apiResponse({
      error: 'ballot does not exist'
    });

    return res.apiResponse({ ballot: ballot });
  });

  // if (!req.user || !req.user.sub)
  // 	return res.status(401).apiResponse({error: 'NOT_LOGGED_IN'});
  //
  // Ballot.model.findOne({bill:req.params.id})
  // 	.$where(UserProfileHelper.getWhereUserFunction(req.user))
  // 	.exec(function(err, ballot)
  // 	{
  // 		if (err)
  // 			return res.apiError('database error', err);
  //
  // 		if (!ballot)
  // 			return res.status(404).apiResponse({
  // 				error: 'ballot does not exist'
  // 			});
  //
  // 		return res.apiResponse({ ballot: ballot });
  // 	});
};

function pushBallotMessageOnQueue(data, callback) {
  try {
    return require('amqplib/callback_api').connect('amqp://localhost', function (err, conn) {
      if (err != null) return callback(err, null);

      return conn.createChannel(function (channelErr, ch) {
        if (channelErr != null) return callback(channelErr, null);

        var ballotObj = { ballot: data };

        ch.assertQueue('ballots');
        ch.sendToQueue('ballots', new Buffer(JSON.stringify(ballotObj)), { persistent: true });

        return callback(null, ballotObj);
      });
    });
  } catch (e) {
    return callback(e, null);
  }
}

function ballotTransactionError(res, ballot, msg) {
  ballot.status = 'error';
  ballot.error = JSON.stringify(msg);
  ballot.save(function (err) {
    if (err) return res.apiError('database error', err);

    return res.status(400).send({ error: msg });
  });
}

exports.vote = function (req, res) {
  if (!config.capabilities.vote.enabled) return res.status(403).send();

  var signedTx = new EthereumTx(req.body.transaction);
  var voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

  return async.waterfall([function (callback) {
    return Vote.model.findById(req.params.voteId).populate('app').exec(callback);
  }, function (vote, callback) {
    if (!vote) return callback({ code: 404, error: 'vote not found' });
    // FIXME: log the unauthorized attempt
    if (!vote.userIsAuthorizedToVote(req.user)) return callback({ code: 403, error: 'unauthorized user' });
    if (vote.voteContractAddress !== voteContractAddress) return callback({ code: 300, error: 'contract address mismatch' });

    return Ballot.getByVoteIdAndUser(vote.id, req.user.sub, function (err, ballot) {
      return callback(err, vote, ballot);
    });
  }, function (vote, ballot, callback) {
    if (!!ballot) return callback({ code: 403, error: 'user already voted' });

    var ballot = Ballot.model({
      voter: Ballot.getHash(vote.id, user),
      status: 'queued'
    });

    return ballot.save(function (err, ballot) {
      return callback(err, vote, ballot);
    });
  }, function (vote, ballot, callback) {
    return pushBallotMessageOnQueue({
      id: ballot.id,
      app: vote.app,
      transaction: req.body.transaction,
      voteContractAddress: vote.voteContractAddress,
      voteContractABI: JSON.parse(vote.voteContractABI)
    }, function (err, msg) {
      return callback(err, ballot);
    });
  }], function (err, ballot) {
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
    return res.apiResponse({ ballot: ballot });
  });
};

// exports.cancel = function(req, res) {
//   if (!config.capabilities.vote.vote)
//     return res.status(403).send();

// Vote.model.findById(req.params.id).exec(function(err, vote)
// {
// 	if (err)
// 		return res.apiError('database error', err);
// 	if (!vote)
// 		return res.apiError('not found');
//
// 	BallotHelper.getByVoteIdAndVoter(
// 		req.params.id,
// 		req.user.sub,
// 		function(err, ballot)
// 		{
// 			if (err)
// 				return res.apiError('database error', err);
//
// 			if (!ballot)
// 				return res.status(404).apiResponse({
// 					error: 'ballot does not exist'
// 				});
//
// 			Ballot.model.findById(ballot.id).remove(function(err)
// 			{
// 				var client = redis.createClient();
// 				var key = 'ballot/' + req.params.id + '/' + req.user.sub;
//
// 				if (err)
// 					return res.apiError('database error', err);
//
// 				client.on('connect', function()
// 				{
// 					client.del(key, function(err, reply)
// 					{
// 						if (err)
// 							console.log(err);
//
// 						return res.apiResponse({ ballot: 'removed' });
// 					});
// 				});
// 			});
// 		});
// });
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYXBpL2JhbGxvdC5qcyJdLCJuYW1lcyI6WyJjb25maWciLCJyZXF1aXJlIiwia2V5c3RvbmUiLCJFdGhlcmV1bVR4IiwiRXRoZXJldW1VdGlsIiwiYXN5bmMiLCJWb3RlIiwibGlzdCIsIkJhbGxvdCIsImV4cG9ydHMiLCJnZXQiLCJyZXEiLCJyZXMiLCJnZXRCeVZvdGVJZEFuZFVzZXIiLCJwYXJhbXMiLCJ2b3RlSWQiLCJ1c2VyIiwic3ViIiwiZXJyIiwiYmFsbG90IiwiYXBpRXJyb3IiLCJzdGF0dXMiLCJhcGlSZXNwb25zZSIsImVycm9yIiwicHVzaEJhbGxvdE1lc3NhZ2VPblF1ZXVlIiwiZGF0YSIsImNhbGxiYWNrIiwiY29ubmVjdCIsImNvbm4iLCJjcmVhdGVDaGFubmVsIiwiY2hhbm5lbEVyciIsImNoIiwiYmFsbG90T2JqIiwiYXNzZXJ0UXVldWUiLCJzZW5kVG9RdWV1ZSIsIkJ1ZmZlciIsIkpTT04iLCJzdHJpbmdpZnkiLCJwZXJzaXN0ZW50IiwiZSIsImJhbGxvdFRyYW5zYWN0aW9uRXJyb3IiLCJtc2ciLCJzYXZlIiwic2VuZCIsInZvdGUiLCJjYXBhYmlsaXRpZXMiLCJlbmFibGVkIiwic2lnbmVkVHgiLCJib2R5IiwidHJhbnNhY3Rpb24iLCJ2b3RlQ29udHJhY3RBZGRyZXNzIiwiYnVmZmVyVG9IZXgiLCJ0byIsIndhdGVyZmFsbCIsIm1vZGVsIiwiZmluZEJ5SWQiLCJwb3B1bGF0ZSIsImV4ZWMiLCJjb2RlIiwidXNlcklzQXV0aG9yaXplZFRvVm90ZSIsImlkIiwidm90ZXIiLCJnZXRIYXNoIiwiYXBwIiwidm90ZUNvbnRyYWN0QUJJIiwicGFyc2UiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsU0FBU0MsUUFBUSxtQ0FBUixDQUFiOztBQUVBLElBQUlDLFdBQVdELFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBSUUsYUFBYUYsUUFBUSxlQUFSLENBQWpCO0FBQ0EsSUFBSUcsZUFBZUgsUUFBUSxp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SUssS0FBakIsQ0FBUDtBQUNEO0FBQ0QsYUFBT1gsSUFBSVEsUUFBSixDQUFhRixHQUFiLENBQVA7QUFDRDtBQUNELFdBQU9OLElBQUlVLFdBQUosQ0FBZ0IsRUFBQ0gsUUFBUUEsTUFBVCxFQUFoQixDQUFQO0FBQ0QsR0F4REksQ0FBUDtBQTBERCxDQWpFRDs7QUFtRUE7QUFDQTtBQUNBOztBQUVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0c7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNHO0FBQ0g7QUFDQTtBQUNHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0c7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRCIsImZpbGUiOiJiYWxsb3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgY29uZmlnID0gcmVxdWlyZSgnL29wdC9jb2Nvcmljby9hcGktd2ViL2NvbmZpZy5qc29uJyk7XG5cbnZhciBrZXlzdG9uZSA9IHJlcXVpcmUoJ2tleXN0b25lJyk7XG52YXIgRXRoZXJldW1UeCA9IHJlcXVpcmUoJ2V0aGVyZXVtanMtdHgnKTtcbnZhciBFdGhlcmV1bVV0aWwgPSByZXF1aXJlKCdldGhlcmV1bWpzLXV0aWwnKTtcbnZhciBhc3luYyA9IHJlcXVpcmUoJ2FzeW5jJyk7XG5cbnZhciBWb3RlID0ga2V5c3RvbmUubGlzdCgnVm90ZScpLFxuICBCYWxsb3QgPSBrZXlzdG9uZS5saXN0KCdCYWxsb3QnKTtcblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbihyZXEsIHJlcykge1xuICBCYWxsb3QuZ2V0QnlWb3RlSWRBbmRVc2VyKFxuXHRcdHJlcS5wYXJhbXMudm90ZUlkLFxuXHRcdHJlcS51c2VyLnN1Yixcblx0XHQoZXJyLCBiYWxsb3QpID0+IHtcbiAgaWYgKGVycilcbiAgICByZXR1cm4gcmVzLmFwaUVycm9yKCdkYXRhYmFzZSBlcnJvcicsIGVycik7XG5cbiAgaWYgKCFiYWxsb3QpXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5hcGlSZXNwb25zZSh7XG4gICAgICBlcnJvcjogJ2JhbGxvdCBkb2VzIG5vdCBleGlzdCcsXG4gICAgfSk7XG5cbiAgcmV0dXJuIHJlcy5hcGlSZXNwb25zZSh7IGJhbGxvdDogYmFsbG90IH0pO1xufVxuXHQpO1xuXG5cdC8vIGlmICghcmVxLnVzZXIgfHwgIXJlcS51c2VyLnN1Yilcblx0Ly8gXHRyZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmFwaVJlc3BvbnNlKHtlcnJvcjogJ05PVF9MT0dHRURfSU4nfSk7XG5cdC8vXG5cdC8vIEJhbGxvdC5tb2RlbC5maW5kT25lKHtiaWxsOnJlcS5wYXJhbXMuaWR9KVxuXHQvLyBcdC4kd2hlcmUoVXNlclByb2ZpbGVIZWxwZXIuZ2V0V2hlcmVVc2VyRnVuY3Rpb24ocmVxLnVzZXIpKVxuXHQvLyBcdC5leGVjKGZ1bmN0aW9uKGVyciwgYmFsbG90KVxuXHQvLyBcdHtcblx0Ly8gXHRcdGlmIChlcnIpXG5cdC8vIFx0XHRcdHJldHVybiByZXMuYXBpRXJyb3IoJ2RhdGFiYXNlIGVycm9yJywgZXJyKTtcblx0Ly9cblx0Ly8gXHRcdGlmICghYmFsbG90KVxuXHQvLyBcdFx0XHRyZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmFwaVJlc3BvbnNlKHtcblx0Ly8gXHRcdFx0XHRlcnJvcjogJ2JhbGxvdCBkb2VzIG5vdCBleGlzdCdcblx0Ly8gXHRcdFx0fSk7XG5cdC8vXG5cdC8vIFx0XHRyZXR1cm4gcmVzLmFwaVJlc3BvbnNlKHsgYmFsbG90OiBiYWxsb3QgfSk7XG5cdC8vIFx0fSk7XG59XG5cbmZ1bmN0aW9uIHB1c2hCYWxsb3RNZXNzYWdlT25RdWV1ZShkYXRhLCBjYWxsYmFjaykge1xuICB0cnkge1xuICAgIHJldHVybiByZXF1aXJlKCdhbXFwbGliL2NhbGxiYWNrX2FwaScpLmNvbm5lY3QoXG4gICAgICAnYW1xcDovL2xvY2FsaG9zdCcsXG4gICAgICAoZXJyLCBjb25uKSA9PiB7XG4gICAgICAgIGlmIChlcnIgIT0gbnVsbClcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcblxuICAgICAgICByZXR1cm4gY29ubi5jcmVhdGVDaGFubmVsKChjaGFubmVsRXJyLCBjaCkgPT4ge1xuICAgICAgICAgIGlmIChjaGFubmVsRXJyICE9IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soY2hhbm5lbEVyciwgbnVsbCk7XG5cbiAgICAgICAgICB2YXIgYmFsbG90T2JqID0geyBiYWxsb3QgOiBkYXRhIH07XG5cbiAgICAgICAgICBjaC5hc3NlcnRRdWV1ZSgnYmFsbG90cycpO1xuICAgICAgICAgIGNoLnNlbmRUb1F1ZXVlKFxuICAgICAgICAgICAgICAnYmFsbG90cycsXG4gICAgICAgICAgICAgIG5ldyBCdWZmZXIoSlNPTi5zdHJpbmdpZnkoYmFsbG90T2JqKSksXG4gICAgICAgICAgICAgIHsgcGVyc2lzdGVudCA6IHRydWUgfVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgYmFsbG90T2JqKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBjYWxsYmFjayhlLCBudWxsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBiYWxsb3RUcmFuc2FjdGlvbkVycm9yKHJlcywgYmFsbG90LCBtc2cpIHtcbiAgYmFsbG90LnN0YXR1cyA9ICdlcnJvcic7XG4gIGJhbGxvdC5lcnJvciA9IEpTT04uc3RyaW5naWZ5KG1zZyk7XG4gIGJhbGxvdC5zYXZlKChlcnIpID0+IHtcbiAgICBpZiAoZXJyKVxuICAgICAgcmV0dXJuIHJlcy5hcGlFcnJvcignZGF0YWJhc2UgZXJyb3InLCBlcnIpO1xuXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKHtlcnJvcjptc2d9KTtcbiAgfSk7XG59XG5cbmV4cG9ydHMudm90ZSA9IGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gIGlmICghY29uZmlnLmNhcGFiaWxpdGllcy52b3RlLmVuYWJsZWQpXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5zZW5kKCk7XG5cbiAgdmFyIHNpZ25lZFR4ID0gbmV3IEV0aGVyZXVtVHgocmVxLmJvZHkudHJhbnNhY3Rpb24pO1xuICB2YXIgdm90ZUNvbnRyYWN0QWRkcmVzcyA9IEV0aGVyZXVtVXRpbC5idWZmZXJUb0hleChzaWduZWRUeC50byk7XG5cbiAgcmV0dXJuIGFzeW5jLndhdGVyZmFsbChcbiAgICBbXG4gICAgICAoY2FsbGJhY2spID0+IFZvdGUubW9kZWwuZmluZEJ5SWQocmVxLnBhcmFtcy52b3RlSWQpXG4gICAgICAgIC5wb3B1bGF0ZSgnYXBwJylcbiAgICAgICAgLmV4ZWMoY2FsbGJhY2spLFxuICAgICAgKHZvdGUsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIGlmICghdm90ZSlcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soe2NvZGU6IDQwNCwgZXJyb3I6ICd2b3RlIG5vdCBmb3VuZCd9KTtcbiAgICAgICAgLy8gRklYTUU6IGxvZyB0aGUgdW5hdXRob3JpemVkIGF0dGVtcHRcbiAgICAgICAgaWYgKCF2b3RlLnVzZXJJc0F1dGhvcml6ZWRUb1ZvdGUocmVxLnVzZXIpKVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayh7Y29kZTogNDAzLCBlcnJvcjogJ3VuYXV0aG9yaXplZCB1c2VyJ30pO1xuICAgICAgICBpZiAodm90ZS52b3RlQ29udHJhY3RBZGRyZXNzICE9PSB2b3RlQ29udHJhY3RBZGRyZXNzKVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayh7Y29kZTogMzAwLCBlcnJvcjogJ2NvbnRyYWN0IGFkZHJlc3MgbWlzbWF0Y2gnfSk7XG5cbiAgICAgICAgcmV0dXJuIEJhbGxvdC5nZXRCeVZvdGVJZEFuZFVzZXIoXG4gICAgICAgICAgdm90ZS5pZCxcbiAgICAgICAgICByZXEudXNlci5zdWIsXG4gICAgICAgICAgKGVyciwgYmFsbG90KSA9PiBjYWxsYmFjayhlcnIsIHZvdGUsIGJhbGxvdClcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICAodm90ZSwgYmFsbG90LCBjYWxsYmFjaykgPT4ge1xuICAgICAgICBpZiAoISFiYWxsb3QpXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHtjb2RlOiA0MDMsIGVycm9yOiAndXNlciBhbHJlYWR5IHZvdGVkJ30pO1xuXG4gICAgICAgIHZhciBiYWxsb3QgPSBCYWxsb3QubW9kZWwoe1xuICAgICAgICAgIHZvdGVyOiBCYWxsb3QuZ2V0SGFzaCh2b3RlLmlkLCB1c2VyKSxcbiAgICAgICAgICBzdGF0dXM6ICdxdWV1ZWQnLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYmFsbG90LnNhdmUoKGVyciwgYmFsbG90KSA9PiBjYWxsYmFjayhlcnIsIHZvdGUsIGJhbGxvdCkpO1xuICAgICAgfSxcbiAgICAgICh2b3RlLCBiYWxsb3QsIGNhbGxiYWNrKSA9PiBwdXNoQmFsbG90TWVzc2FnZU9uUXVldWUoXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogYmFsbG90LmlkLFxuICAgICAgICAgIGFwcDogdm90ZS5hcHAsXG4gICAgICAgICAgdHJhbnNhY3Rpb246IHJlcS5ib2R5LnRyYW5zYWN0aW9uLFxuICAgICAgICAgIHZvdGVDb250cmFjdEFkZHJlc3M6IHZvdGUudm90ZUNvbnRyYWN0QWRkcmVzcyxcbiAgICAgICAgICB2b3RlQ29udHJhY3RBQkk6IEpTT04ucGFyc2Uodm90ZS52b3RlQ29udHJhY3RBQkkpLFxuICAgICAgICB9LFxuICAgICAgICAoZXJyLCBtc2cpID0+IGNhbGxiYWNrKGVyciwgYmFsbG90KVxuICAgICAgKSxcbiAgICBdLFxuICAgIChlcnIsIGJhbGxvdCkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAoYmFsbG90KSB7XG4gICAgICAgICAgcmV0dXJuIGJhbGxvdFRyYW5zYWN0aW9uRXJyb3IocmVzLCBiYWxsb3QsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyci5jb2RlKSB7XG4gICAgICAgICAgcmVzLnN0YXR1cyhlcnIuY29kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyci5lcnJvcikge1xuICAgICAgICAgIHJldHVybiByZXMuYXBpRXJyb3IoZXJyLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLmFwaUVycm9yKGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzLmFwaVJlc3BvbnNlKHtiYWxsb3Q6IGJhbGxvdH0pO1xuICAgIH1cbiAgKTtcbn1cblxuLy8gZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbihyZXEsIHJlcykge1xuLy8gICBpZiAoIWNvbmZpZy5jYXBhYmlsaXRpZXMudm90ZS52b3RlKVxuLy8gICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuc2VuZCgpO1xuXG5cdC8vIFZvdGUubW9kZWwuZmluZEJ5SWQocmVxLnBhcmFtcy5pZCkuZXhlYyhmdW5jdGlvbihlcnIsIHZvdGUpXG5cdC8vIHtcblx0Ly8gXHRpZiAoZXJyKVxuXHQvLyBcdFx0cmV0dXJuIHJlcy5hcGlFcnJvcignZGF0YWJhc2UgZXJyb3InLCBlcnIpO1xuXHQvLyBcdGlmICghdm90ZSlcblx0Ly8gXHRcdHJldHVybiByZXMuYXBpRXJyb3IoJ25vdCBmb3VuZCcpO1xuICAgIC8vXG5cdC8vIFx0QmFsbG90SGVscGVyLmdldEJ5Vm90ZUlkQW5kVm90ZXIoXG5cdC8vIFx0XHRyZXEucGFyYW1zLmlkLFxuXHQvLyBcdFx0cmVxLnVzZXIuc3ViLFxuXHQvLyBcdFx0ZnVuY3Rpb24oZXJyLCBiYWxsb3QpXG5cdC8vIFx0XHR7XG5cdC8vIFx0XHRcdGlmIChlcnIpXG5cdC8vIFx0XHRcdFx0cmV0dXJuIHJlcy5hcGlFcnJvcignZGF0YWJhc2UgZXJyb3InLCBlcnIpO1xuICAgIC8vXG5cdC8vIFx0XHRcdGlmICghYmFsbG90KVxuXHQvLyBcdFx0XHRcdHJldHVybiByZXMuc3RhdHVzKDQwNCkuYXBpUmVzcG9uc2Uoe1xuXHQvLyBcdFx0XHRcdFx0ZXJyb3I6ICdiYWxsb3QgZG9lcyBub3QgZXhpc3QnXG5cdC8vIFx0XHRcdFx0fSk7XG4gICAgLy9cblx0Ly8gXHRcdFx0QmFsbG90Lm1vZGVsLmZpbmRCeUlkKGJhbGxvdC5pZCkucmVtb3ZlKGZ1bmN0aW9uKGVycilcblx0Ly8gXHRcdFx0e1xuXHQvLyBcdFx0XHRcdHZhciBjbGllbnQgPSByZWRpcy5jcmVhdGVDbGllbnQoKTtcblx0Ly8gXHRcdFx0XHR2YXIga2V5ID0gJ2JhbGxvdC8nICsgcmVxLnBhcmFtcy5pZCArICcvJyArIHJlcS51c2VyLnN1YjtcbiAgICAvL1xuXHQvLyBcdFx0XHRcdGlmIChlcnIpXG5cdC8vIFx0XHRcdFx0XHRyZXR1cm4gcmVzLmFwaUVycm9yKCdkYXRhYmFzZSBlcnJvcicsIGVycik7XG4gICAgLy9cblx0Ly8gXHRcdFx0XHRjbGllbnQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpXG5cdC8vIFx0XHRcdFx0e1xuXHQvLyBcdFx0XHRcdFx0Y2xpZW50LmRlbChrZXksIGZ1bmN0aW9uKGVyciwgcmVwbHkpXG5cdC8vIFx0XHRcdFx0XHR7XG5cdC8vIFx0XHRcdFx0XHRcdGlmIChlcnIpXG5cdC8vIFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcbiAgICAvL1xuXHQvLyBcdFx0XHRcdFx0XHRyZXR1cm4gcmVzLmFwaVJlc3BvbnNlKHsgYmFsbG90OiAncmVtb3ZlZCcgfSk7XG5cdC8vIFx0XHRcdFx0XHR9KTtcblx0Ly8gXHRcdFx0XHR9KTtcblx0Ly8gXHRcdFx0fSk7XG5cdC8vIFx0XHR9KTtcblx0Ly8gfSk7XG4vLyB9XG4iXX0=