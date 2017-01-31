import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import EthereumTx from 'ethereumjs-tx';
import EthereumUtil from 'ethereumjs-util';
import jwt from 'jsonwebtoken';
import Web3 from 'web3';
import CryptoJS from 'crypto-js';
import promise from 'thenify';
import stringify from 'json-stable-stringify';

import * as cache from '../../cache';
import pushBallotOnQueue from '../../pushBallotOnQueue';

const Vote = keystone.list('Vote'),
  VerifiedBallot = keystone.list('VerifiedBallot'),
  Event = keystone.list('Event');

export async function get(req, res) {
  try {
    const v = await Vote.model.findById(req.params.voteId).exec();

    if (!v) {
      return res.status(404).apiResponse({error: 'vote does not exist'});
    }

    try {
      const ballot = await v.getBallotByUserUID(req.user.sub);

      if (!ballot) {
        return res.status(404).apiResponse({
          error: 'ballot does not exist',
        });
      }

      return res.apiResponse({ballot: ballot});
    } catch (ballotErr) {
      return res.apiError('database error', err);
    }
  } catch (findVoteErr) {
    return res.apiError('database error', findVoteErr);
  }
}

function getTxFunctionSignature(abi, functionName) {
  function matchesFunctionName(json) {
    return (json.name === functionName && json.type === 'function');
  }

  function getTypes(json) {
    return json.type;
  }

  var funcJson = abi.filter(matchesFunctionName)[0];
  var types = (funcJson.inputs).map(getTypes);

  return CryptoJS.SHA3(
      functionName + '(' + types.join() + ')',
      { outputLength: 256 }
    )
    .toString(CryptoJS.enc.Hex).slice(0, 8);
}

export async function post(req, res) {
  if (!config.capabilities.vote.enabled)
    return res.status(403).send();

  const signedTx = new EthereumTx(req.body.transaction);
  const voteContractAddress = EthereumUtil.bufferToHex(signedTx.to);

  try {
    const vote = await Vote.model.findById(req.params.voteId)
      .populate('app')
      .exec();

    if (!vote)
      return res.status(404).send({error: 'vote not found'});
    if (!vote.userIsAuthorizedToVote(req.user)) {
      await Event.logWarningEventAndBlacklist(req, 'unauthorized user');
      return res.status(403).send({error: 'unauthorized user'});
    }
    if (vote.voteContractAddress !== voteContractAddress) {
      await Event.logWarningEventAndBlacklist(
        req, 'contract address mismatch'
      );
      return res.status(300).send({error: 'contract address mismatch'});
    }

    // The transaction *must* call Vote.vote(). To enforce this, we check
    // that the function signature in the tx data matches with the one we
    // expect.
    const sig = getTxFunctionSignature(
      JSON.parse(vote.voteContractABI),
      'vote'
    );
    if (signedTx.data.toString('hex', 0, 4) !== sig) {
      await Event.logWarningEventAndBlacklist(req, 'invalid transaction');
      return res.status(300).send({error: 'invalid transaction'});
    }

    try {
      // Check if there is an existing ballot for this user.
      const existingBallot = await vote.getBallotByUserUID(req.user.sub);

      // Log a warning event and return 403 if there is.
      if (!!existingBallot) {
        await Event.logWarningEventAndBlacklist(req, 'user already voted');
        return res.status(403).send({error: 'user already voted'});
      }

      var proofOfVote = null;
      try {
        // The call to getProofOfVote() will fail if we can't read the expected
        // transaction parameters (ie uint8[numProposals]).
        proofOfVote = vote.getProofOfVote(signedTx);
      } catch (proofOfVoteErr) {
        return res.status(300).send({error: 'invalid transaction'});
      }

      // Create and save the new ballot otherwise.
      // From this point, subsequent request to this endpoint will return 403.
      const newBallot = await vote.createBallot(req.user.sub).save();

      try {
        // Push the ballot on the queue for the ballot service to handle.
        try {
          await pushBallotOnQueue({
            id: newBallot.id,
            app: vote.app,
            vote: {id: vote.id},
            user: {sub: req.user.sub},
            step: newBallot.step, // queued
            transaction: req.body.transaction,
            voteContractAddress: vote.voteContractAddress,
            voteContractABI: JSON.parse(vote.voteContractABI),
          });
        } catch (pushOnQueueErr) {
          return res.apiError('queue error', pushOnQueueErr);
        }

        // Update the ballot counter.
        vote.numBallots += 1;

        try {
          // Save the updated vote and return the ballot + the proof of vote.
          await vote.save();

          return res.apiResponse({
            ballot: newBallot,
            proof: proofOfVote,
          });

        } catch (voteSaveErr) {
          return res.apiError('database error when saving Vote', voteSaveErr);
        }
      } catch (newBallotErr) {
        return res.apiError('database error when saving Ballot', newBallotErr);
      }
    } catch (ballotErr) {
      return res.apiError('database error when finding Ballot', ballotErr);
    }
  } catch (findVoteErr) {
    return res.apiError('database error when finding Vote', findVoteErr);
  }
}

export async function verify(req, res) {
  if (!req.body.proofOfVote) {
    return res.status(400).send({error:'missing proofOfVote'});
  }

  // First, we decode the JWT without checking the signature because we need
  // to get the vote smart contract address from the payload.
  var decoded = null;
  try {
    decoded = jwt.decode(req.body.proofOfVote);
  } catch (decodeErr) {
    return res.apiError('unable to decode JWT', decodeErr);
  }

  if (!decoded) {
    return res.status(400).send();
  }

  var vote = null;
  try {
    // We fetch the vote that match the smart contract address.
    vote = await Vote.model
      .findOne({voteContractAddress: '0x' + decoded.c})
      .exec();
  } catch (findVoteErr) {
    return res.apiError('database error when fetching the vote', findVoteErr);
  }

  // If the vote does not exist => 404
  if (!vote) {
    return res.status(404).send({error:'vote does not exist'});
  }

  // Otherwise, we verify the JWT
  var verified = null;
  try {
    verified = jwt.verify(req.body.proofOfVote, vote.key);
  } catch (verifyErr) {
    return res.apiError('invalid JWT', verifyErr);
  }

  var ballot = null;
  try {
    ballot = await VerifiedBallot.model
      .findOne({voterAddress: '0x' + decoded.a})
      .exec();
  } catch (findBallotErr) {
    return res.apiError('database error', err);
  }

  // If there is an existing verified ballot, we return it directly.
  if (!!ballot) {
    return res.apiResponse({verified: ballot});
  }

  // Otherwise, we do have to verify the provided proof of vote and save
  // the corresponding VerifiedBallot.
  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

  // If the JWT is verified, we find the corresponding smart contract
  // instance.
  var events = null;
  try {
    const contract = web3.eth.contract(JSON.parse(vote.voteContractABI));
    const instance = await promise((...c)=>contract.at(...c))(
      vote.voteContractAddress
    );
    // Fetch all the BallotEvent from the smart contract for the address
    // specified in the proof of vote (the 'a' field for 'address').
    // FIXME: we should set 'fromBlock' to the block of the smart contract
    // to avoid querying the whole blockchain.
    const ballotEvent = instance.Ballot(
      {voter: '0x' + verified.a},
      {fromBlock: 0, toBlock: 'latest'}
    );

    events = await promise((...c)=>ballotEvent.get(...c))();
  } catch (blockchainErr) {
    return res.apiError('blockchain error', blockchainErr);
  }

  // The proof of vote/ballot is valid if:
  // * there is a matching BallotEvent
  // * its args.proposal field matches the one in the proof of vote
  // (the 'p' field for 'proposal')
  const ballotValue = Array.isArray(verified.p)
    // the new format, where each ballot is an uint[]
    ? events[0].args.ballot.map((s) => parseInt(s))
    // the "old" format, where each ballot was just an uint
    : parseInt(events[0].args.proposal);
  const equals = Array.isArray(verified.p)
    ? (a, b) => Array.isArray(a) && Array.isArray(b) && a.every((u, i) => u === b[i])
    : (a, b) => a === b;
  const valid = !!events[0] && !!events[0].args
    && equals(ballotValue, verified.p);

  var verifiedBallot = null;
  try {
    // Create and save the corresponding VerifiedBallot.
    verifiedBallot = await VerifiedBallot
      .model({
        vote: vote,
        valid: valid,
        transactionHash: !!events[0] && !!events[0].transactionHash
          ? events[0].transactionHash
          : '',
        voterAddress: '0x' + verified.a,
      })
      .save();
  } catch (verifiedBallotSaveErr) {
    return res.apiError('database error', verifiedBallotSaveErr);
  }

  // Update and save the vote.
  if (verifiedBallot.valid) {
    vote.numValidBallots += 1;
  } else {
    vote.numInvalidBallots += 1;
  }

  // Invalidate the cache
  cache.unset(
    await cache.keys('/ballot/transactions/' + vote.id + '&*')
  );

  try {
    await vote.save();
  } catch (voteSaveErr) {
    return res.apiError('database error', voteSaveErr);
  }

  return res.apiResponse({
    verified: verifiedBallot,
  });
}

export async function getTransactions(req, res) {
  const voteId = req.params.voteId;

  try {
    const vote = await Vote.model.findById(voteId).exec();

    if (!vote) {
      return res.status(404).send();
    }

    if (vote.status !== 'complete') {
      return res.status(403).send();
    }

    var transactionHash = req.body.transactionHash;
    var voter = req.body.voter;
    const ballot = req.body.ballot;
    const page = !req.body.page ? 0 : parseInt(req.body.page);
    const key = '/ballot/transactions/' + voteId + '&params=' + stringify({
      page: page,
      transactionHash: transactionHash,
      voter: voter,
      ballot: ballot,
    });

    try {
      const cached = await cache.get(key);

      if (!!cached) {
        return res.apiResponse(cached);
      }
    } catch (cacheErr) {
      return res.apiError('cache error', cacheErr);
    }

    var filter = null;
    if (!!transactionHash) {
      if (transactionHash.indexOf('0x') !== 0) {
        transactionHash = '0x' + transactionHash;
      }
      filter = (tx) => tx.transactionHash.indexOf(transactionHash) === 0;
    } else if (!!voter) {
      if (voter.indexOf('0x') !== 0) {
        voter = '0x' + voter;
      }
      filter = (tx) => tx.args.voter.indexOf(voter) === 0;
    } else if (!!ballot) {
      filter = (tx) => Math.round(tx.args.ballot.toNumber()) === parseInt(ballot);
    }

    try {
      const key2 = '/ballot/transactions/' + voteId;

      var result = await cache.get(key2);

      if (!result) {
        try {
          const web3 = new Web3();
          web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

          const contract = web3.eth.contract(JSON.parse(vote.voteContractABI));
          const instance = await promise((...c)=>contract.at(...c))(
            vote.voteContractAddress
          );
          const ballotEvent = instance.Ballot(
            null,
            // FIXME: fromBlock should be the block of vote.voteContractAddress
            {fromBlock: 0, toBlock: 'latest'}
          );

          result = await promise((cb)=>ballotEvent.get(cb))();
          // convert the ballot values to actual uints
          for (var r of result) {
            r.args.ballot = r.args.ballot.map((v) => ~~v.toNumber());
          }
          cache.set(key2, result);
        } catch (atErr) {
          return res.apiError('blockchain error', atErr);
        }
      }

      const numItems = result.length;

      if (!!filter) {
        result = result.filter(filter);
      }

      const numPages = Math.ceil(result.length / 10);
      result = result.slice(page * 10, page * 10 + 10);

      try {
        const verifiedBallots = await VerifiedBallot.model
          .find({
            $or: [
              { transactionHash: {$in: result.map((r)=>r.transactionHash)}},
              { voterAddress: {$in: result.map((r)=>r.address)}},
            ]
          })
          .exec();

        for (var ballot of verifiedBallots) {
          for (var tx of result) {
            if (tx.transactionHash === ballot.transactionHash
                || tx.address === ballot.voterAddress) {
              tx.valid = ballot.valid;
            }
          }
        }

        var response = {
          numItems: numItems,
          page: page,
          numPages: numPages,
          transactions: result,
        };

        cache.set(key, response);

        return res.apiResponse(response);
      } catch (findBallotErr) {
        return res.apiError('database error when finding ballot', findBallotErr);
      }
    } catch (ballotEventErr) {
      return res.apiError('blockchain error', ballotEventErr);
    }
  } catch (findVoteErr) {
    return res.apiError('database error when finding vote', findVoteErr);
  }
}
