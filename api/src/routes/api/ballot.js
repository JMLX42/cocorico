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
              proof: vote.getProofOfVote(signedTx),
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
  var decoded = jwt.decode(req.body.proofOfVote);

  if (!decoded) {
    return res.status(400).send();
  }

  try {
    const ballot = await VerifiedBallot.model
      .findOne({voterAddress: '0x' + decoded.a})
      .exec();

    // If there is an existing verified ballot, we return it directly.
    if (!!ballot) {
      return res.apiResponse({verified: ballot});
    }

    // Otherwise, we do have to verify the provided proof of vote and save
    // the corresponding VerifiedBallot.
    const web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

    // We fetch the vote that match the smart contract address.
    const vote = await Vote.model
      .findOne({voteContractAddress: '0x' + decoded.c})
      .exec();

    // If the vote does not exist => 404
    if (!vote) {
      return res.status(404).send({error:'vote does not exist'});
    } else {
      // Otherwise, we verify the JWT
      try {
        const verified = jwt.verify(req.body.proofOfVote, vote.key);

        // If the JWT is verified, we find the corresponding smart contract
        // instance.
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
            {fromBlock:0, toBlock: 'latest'}
          );
          const events = await promise((...c)=>ballotEvent.get(...c))();
          // The proof of vote/ballot is valid if:
          // * there is a matching BallotEvent
          // * its args.proposal field matches the one in the proof of vote
          // (the 'p' field for 'proposal')
          const valid = !!events[0] && !!events[0].args
            && parseInt(events[0].args.proposal) === verified.p;

          try {
            // Create and save the corresponding VerifiedBallot.
            const verifiedBallot = await VerifiedBallot
              .model({
                vote: vote,
                valid: valid,
                transactionHash: valid ? events[0].transactionHash : '',
                voterAddress: '0x' + verified.a,
              })
              .save();

            // Update and save the vote.
            if (verifiedBallot.valid) {
              vote.numValidBallots += 1;
            } else {
              vote.numInvalidBallots += 1;
            }

            try {
              await vote.save();

              return res.apiResponse({
                verified: verifiedBallot,
              });

            } catch (voteSaveErr) {
              return res.apiError('database error', voteSaveErr);
            }
          } catch (verifiedBallotSaveErr) {
            return res.apiError('database error', verifiedBallotSaveErr);
          }
        } catch (blockchainErr) {
          return res.apiError('blockchain error', blockchainErr);
        }
      } catch (verifyErr) {
        return res.apiError('invalid JWT', verifyErr);
      }
    }
  } catch (findBallotErr) {
    return res.apiError('database error', err);
  }
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
    const proposal = req.body.proposal;
    const page = !req.body.page ? 0 : parseInt(req.body.page);
    const key = '/ballot/transactions/' + voteId + '&params=' + stringify({
      page: page,
      transactionHash: transactionHash,
      voter: voter,
      proposal: proposal,
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
    } else if (!!proposal) {
      filter = (tx) => Math.round(tx.args.proposal.toNumber()) === parseInt(proposal);
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
          cache.set(key2, result);
        } catch (atErr) {
          return res.apiError('blockchain error', atErr);
        }
      }

      var numItems = result.length;

      if (!!filter) {
        result = result.filter(filter);
      }

      var numPages = Math.ceil(result.length / 10);
      result = result.slice(page * 10, page * 10 + 10);

      try {
        const verifiedBallots = await VerifiedBallot.model.find({
          transactionHash: {$in: result.map((r)=>r.transactionHash)}}
        ).exec();

        for (var ballot of verifiedBallots) {
          for (var tx of result) {
            if (tx.transactionHash === ballot.transactionHash) {
              tx.verified = ballot.valid;
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
