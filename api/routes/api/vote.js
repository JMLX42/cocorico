var config = require('../../config.json');

var keystone = require('keystone');
var Web3 = require('web3');
var async = require('async');
var metafetch = require('metafetch');
var fetch = require('node-fetch');
var webshot = require('webshot');
var md5 = require('md5');

var Vote = keystone.list('Vote'),
  Source = keystone.list('Source');

exports.list = function(req, res) {
  Vote.model.find()
    .exec((err, votes) => {
      if (err)
        return res.apiError('database error', err);

      return res.apiResponse({votes: votes});
    });
}

exports.get = function(req, res) {
  Vote.model.findById(req.params.voteId)
    .exec((err, vote) => {
      if (err)
        return res.apiError('database error', err);

      if (!vote)
        return res.status(404).send();

      return res.apiResponse({vote: vote});
    });
}

exports.getBySlug = function(req, res) {
  Vote.model.findOne({slug: req.params.voteSlug})
        .exec((err, vote) => {
          if (err)
            return res.apiError('database error', err);

          if (!vote)
            return res.status(404).send();

          return res.apiResponse({vote: vote});
        });
}

exports.create = function(req, res) {
  var app = req.user;

  var url = decodeURIComponent(req.body.url);
  if (!url) {
    return res.status(400).send({error: 'missing url'});
  }

  var labels = [];

  if (req.body.labels) {
    try {
      labels = JSON.parse(req.body.labels);
    } catch (e) {
      return res.status(400).send({
        error: 'invalid labels with error \'' + e.message + '\'',
      });
    }
  }

  return async.waterfall(
    [
      (callback) => !app.isValidURL(url)
        ? callback({code: 403, error: 'invalid url'}, null)
        : Vote.model.findOne({url: url})
            .exec((err, vote) => callback(err, vote)),
      // Step 2: check there is no vote for this URL and fetch meta fields
      // if there is not.
      (vote, callback) => !!vote
        ? callback({code: 400, error: 'invalid url'}, null)
        : Vote.model({
          app: app.id,
          url: url,
          restricted: req.body.restricted === 'true',
          labels: labels,
        }).save((err, vote) => callback(err, vote)),
    ],
        (err, vote) => {
          if (err) {
            if (err.code) {
              res.status(err.code);
            }
            if (err.error) {
              return res.apiError(err.error);
            }
            return res.apiError(err);
          }
          return res.apiResponse({vote: vote});
        }
    );
}

exports.update = function(req, res) {
  var voteId = req.params.voteId;

  Vote.model.findById(voteId)
    .exec((findVoteErr, vote) => {
      if (findVoteErr)
        return res.apiError('database error', findVoteErr);

      if (!vote)
        return res.status(404).send();

      if (vote.app !== req.user.id) {
        return res.status(403).send();
      }

      for (propertyName in vote) {
        if (propertyName in req.body) {
          vote[propertyName] = req.body[propertyName];
        }
      }

      return vote.save((err) => {
        if (err)
          return res.apiError('database error', err);

        return res.apiResponse({vote: vote});
      });
    });
}

// exports.resultPerDate = function(req, res) {
//     var voteId = req.params.voteId;
//
//     Vote.model.findById(voteId)
//         .exec((err, vote) => {
//             if (err)
//                 return res.apiError('database error', err);
//
//             if (!vote)
//                 return res.status(404).send();
//
//             res.apiResponse({result : null});
//         });
// }
//
// exports.resultPerGender = function(req, res) {
//     var voteId = req.params.voteId;
//
//     Vote.model.findById(voteId)
//         .exec((err, vote) => {
//             if (err)
//                 return res.apiError('database error', err);
//
//             if (!vote)
//                 return res.status(404).send();
//
//             res.apiResponse({result : null});
//         });
// }
//
// exports.resultPerAge = function(req, res) {
//     var voteId = req.params.voteId;
//
//     Vote.model.findById(voteId)
//         .exec((err, vote) => {
//             if (err)
//                 return res.apiError('database error', err);
//
//             if (!vote)
//                 return res.status(404).send();
//
//             res.apiResponse({result : null});
//         });
// }

exports.result = function(req, res) {
  var voteId = req.params.voteId;

  Vote.model.findById(voteId)
    .exec((findVoteErr, vote) => {
      if (findVoteErr)
        return res.apiError('database error', findVoteErr);

      if (!vote)
        return res.status(404).send();

      var web3 = new Web3();
      web3.setProvider(new web3.providers.HttpProvider(
        'http://127.0.0.1:8545'
      ));

      return web3.eth.contract(JSON.parse(vote.voteContractABI)).at(
        vote.voteContractAddress,
        (err, voteInstance) => res.apiResponse(
          {result : voteInstance.getVoteResults().map((s) => parseInt(s))}
        )
      );
    });
}

exports.embed = function(req, res) {
  if (!req.headers.referer) {
    return res.status(400).send({error : 'missing referer'});
  }

  return async.waterfall(
    [
      (callback) => Vote.model.findById(req.params.voteId).exec(callback),
      (vote, callback) => !vote
        ? callback({code: 404, msg: 'vote not found'}, null)
        : callback(null, vote),
        // Step 0: fetch the page meta to get the unique URL
      (vote, callback) => metafetch.fetch(
        req.headers.referer,
        {
          flags: { images: false, links: false },
          http: { timeout: 30000 },
        },
        (err, meta) => callback(err, vote, meta)
      ),
      // Step 1: find the corresponding Source
      (vote, meta, callback) => Source.model.findOne({url: meta.url})
        .exec((err, source) => callback(err, vote, meta, source)),
      // Step 2: continue if the source does not exist
      (vote, meta, source, callback) => !!source
        ? callback({code: 400, msg: 'already listed'}, null)
        : callback(null, vote, meta, source),
      // Step 3: fetch the content of the page to check that the vote
      // button embed code is present
      (vote, meta, source, callback) => fetch(meta.url)
        .then((fetchRes) => {
          if (!fetchRes.ok || fetchRes.status !== 200) {
            return callback({code: 400, msg: 'unable to fetch page'}, null);
          }
          if (fetchRes.headers.get('content-type').indexOf('text/html') < 0) {
            return callback({code: 400, msg: 'invalid content type'}, null);
          }

          return fetchRes.text();
        })
        .then((html) => {
            // FIXME: check the actual vote button embed button
          if (html.indexOf('<iframe') < 0) {
            return callback({code: 400, msg: 'missing embed code'});
          }

          if (!meta.image) {
            var filename = md5(meta.url) + '.jpg';
            return webshot(
              meta.url,
              '/vagrant/app/public/img/screenshot' + filename,
              (err) => {
                if (!err) {
                  meta.image = filename;
                }
                return callback(err, vote, meta, source);
              }
            );
          } else {
            return callback(null, vote, meta, source);
          }
        }),
      (vote, meta, source, callback) => Source.model({
        url: meta.url,
        vote: vote,
        title: meta.title,
        description: meta.description,
        type: meta.type,
        image: meta.image,
      }).save(callback),
    ],
      (err, source) => {
        if (err) {
          if (err.code) {
            res.status(err.code);
            if (err.msg) {
              return res.send({error : err.msg});
            }
            return res.send();
          }
          return res.apiError(err);
        }
        return res.apiResponse({source: source});
      }
    );
}

exports.permissions = function(req, res) {
  var voteId = req.params.voteId;

  Vote.model.findById(voteId)
        .exec((err, vote) => {
          if (err) {
            return res.apiError('database error', err);
          }

          if (!vote) {
            return res.status(404).send();
          }

          return res.apiResponse({
            permissions : {
              read: config.capabilities.vote.read,
              vote: !!req.user && vote.userIsAuthorizedToVote(req.user),
              update: config.capabilities.vote.update,
            },
          });
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

      // FIXME: Add 403 if vote.status != complete

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
                  return res.apiError('blockchain error', ballotEventErr);
                }

                return res.apiResponse({transactions:result});
              });
            }
        );

    });
}
