import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import Web3 from 'web3';
import async from 'async';
import metafetch from 'metafetch';
import fetch from 'node-fetch';
import webshot from 'webshot';
import md5 from 'md5';
import promise from 'thenify';

import cache from '../../cache';

const Vote = keystone.list('Vote'),
  Source = keystone.list('Source');

export async function list(req, res) {
  try {
    const votes = await Vote.model.find.exec();

    return res.apiResponse({votes: votes});
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

export async function get(req, res) {
  try {
    const vote = await Vote.model.findById(req.params.voteId).exec();

    if (!vote) {
      return res.status(404).send();
    }

    return res.apiResponse({vote: vote});
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

export async function getBySlug(req, res) {
  try {
    const vote = await Vote.model.findOne({slug: req.params.voteSlug}).exec();

    if (!vote) {
      return res.status(404).send();
    }

    return res.apiResponse({vote: vote});
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

export async function create(req, res) {
  if (!req.body.url) {
    return res.status(400).send({error: 'missing url'});
  }

  const app = req.user;
  const url = decodeURIComponent(req.body.url);
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

  if (!app.isValidURL(url)) {
    return res.status(403).send({error: 'invalid url'});
  }

  try {
    const existingVote = await Vote.model.findOne({url: url}).exec();

    // Check there is no vote for this URL and fetch meta fields if there is
    // not.
    if (!!existingVote) {
      return res.status(400).send({error: 'invalid url'});
    }

    const newVote = Vote.model({
      app: app.id,
      url: url,
      restricted: req.body.restricted === 'true',
      labels: labels,
      question: req.body.question,
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
    });

    try {
      await newVote.save();
    } catch (newVoteSaveErr) {
      return res.apiError('database error when saving new vote', newVoteSaveErr);
    }

    return res.apiResponse({vote: newVote});
  } catch (findVoteErr) {
    return res.apiError('database error when finding vote', findVoteErr);
  }
}

export async function update(req, res) {
  const voteId = req.params.voteId;

  try {
    const vote = await Vote.model.findById(voteId).exec();

    if (!vote)
      return res.status(404).send();

    if (vote.app.toString() !== req.user.id) {
      return res.status(403).send();
    }

    if (!!req.body.labels && req.body.labels.length !== vote.labels.length) {
      return res.status(400).send({error: 'invalid labels'});
    }

    for (var propertyName in vote) {
      if (propertyName in req.body) {
        vote[propertyName] = req.body[propertyName];
      }
    }

    try {
      await vote.save();

      return res.apiResponse({vote: vote});
    } catch (voteSaveErr) {
      return res.apiError('database error', voteSaveErr);
    }
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

// export function resultPerDate(req, res) {
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
// export function resultPerGender(req, res) {
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
// export function resultPerAge(req, res) {
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

export async function result(req, res) {
  const voteId = req.params.voteId;
  const cacheKey = '/vote/result/' + voteId;
  const cached = await cache.get(cacheKey);

  if (!!cached) {
    return res.apiResponse(cached);
  }

  try {
    const vote = await Vote.model.findById(voteId).exec();

    if (!vote)
      return res.status(404).send();

    if (vote.status !== 'complete')
      return res.status(403).send();

    const web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(
      'http://127.0.0.1:8545'
    ));

    try {
      const contract = web3.eth.contract(JSON.parse(vote.voteContractABI));
      const instance = await promise((...c)=>contract.at(...c))(
        vote.voteContractAddress
      );
      const response = {
        result : instance.getVoteResults().map((s) => parseInt(s)),
      };

      cache.set(cacheKey, response);

      return res.apiResponse(response);
    } catch (blockchainErr) {
      return res.apiError('blockchain error', blockchainErr);
    }
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

export function embed(req, res) {
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

export async function permissions(req, res) {
  const voteId = req.params.voteId;

  try {
    const vote = await Vote.model.findById(voteId).exec();

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
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}
