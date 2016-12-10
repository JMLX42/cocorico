import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';
import metafetch from 'metafetch';
import Web3 from 'web3';
import bcrypt from 'bcrypt';
import srs from 'secure-random-string';
import SolidityCoder from 'web3/lib/solidity/coder';
import jwt from 'jsonwebtoken';
import promise from 'thenify';
import amqplib from 'amqplib';

import logger from '../logger';

const Ballot = keystone.list('Ballot');

const Types = keystone.Field.Types;

const Vote = new keystone.List('Vote', {
  autokey: { path: 'slug', from: 'title', unique: true },
  // map: { name: 'title' },
  defaultSort: '-createdAt',
  track: { createdAt: true, updatedAt: true },
  noedit: config.env !== 'development',
  nocreate: config.env !== 'development',
  nodelete: config.env !== 'development',
});

Vote.add({
  app: { type: Types.Relationship, ref: 'App', initial: true },
  url: { type: Types.Url, initial: true },
  title: { type: Types.Text },
  description: { type: Types.Textarea },
  image: { type: Types.Url },
  status: {
    type: Types.Select,
    options: ['initializing', 'open', 'complete', 'error'],
  },
  voteContractAddress: { type: Types.Text, noedit: true },
  voteContractABI: { type: Types.Text, noedit: true },
  restricted: { type: Types.Boolean, default: false },
  labels: { type: Types.TextArray },
  question: { type: Types.Text },
  salt: { type: Types.Text, noedit: true, default: () => bcrypt.genSaltSync(10) },
  key: { type: Types.Key, noedit: true, default: () => srs(32).toLowerCase() },
  numBallots: { type: Types.Number, default: 0 },
  numValidBallots: { type: Types.Number, default: 0 },
  numInvalidBallots: { type: Types.Number, default: 0 },
});

Vote.relationship({ path: 'sources', ref: 'Source', refPath: 'vote' });
Vote.relationship({ path: 'verified ballots', ref: 'VerifiedBallot', refPath: 'vote' });

Vote.schema.methods.userIsAuthorizedToVote = function(user) {
  return config.capabilities.vote.enabled
    && this.status === 'open'
    && !!this.voteContractAddress
    && !!this.voteContractABI
    && !!user
    && (!this.restricted || (!!user.iss && this.app.equals(user.iss)))
    && (!user.authorizedVotes
      || !user.authorizedVotes.length
      || user.authorizedVotes.indexOf(this.id) >= 0);
}

Vote.schema.methods.createBallot = function(uid) {
  return Ballot.model({
    vote: this,
    hash: bcrypt.hashSync(uid, this.salt),
  });
}

Vote.schema.methods.getBallotByUserUID = async function(uid) {
  return Ballot.model.findOne({hash: bcrypt.hashSync(uid, this.salt)}).exec();
}

async function closeVoteContract(vote) {
  if (!vote.voteContractAddress) {
    return null;
  }

  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
  ));

  try {
    const accounts = await promise((...c)=>web3.eth.getAccounts(...c))();
    const contract = web3.eth.contract(JSON.parse(vote.voteContractABI));
    const instance = await promise((...c)=>contract.at(...c))(vote.voteContractAddress);
    const txHash = await promise((...c)=>instance.close.sendTransaction(...c))({from: accounts[0]});

    return txHash;
  } catch (err) {
    logger.error('blockchain error', err);
    return null;
  }
}

var conn = null;
var ch = null;

async function pushVoteOnQueue(vote) {
  if (!conn) {
    conn = await amqplib.connect(null, {heartbeat:30});
    ch = await conn.createChannel();
  }

  await ch.assertQueue('votes', {autoDelete: false, durable: true});

  const voteMsg = {vote : {
    id: vote.id,
    numProposals: vote.labels.length === 0 ? 3 : vote.labels.length,
  }};

  ch.sendToQueue(
    'votes',
    new Buffer(JSON.stringify(voteMsg)),
    {persistent: true}
  );
}

Vote.schema.pre('validate', async function(next) {
  const self = this;

  if (!self.url) {
    return next(null);
  }

  if (self.isModified('status') && self.status === 'complete') {
    return await closeVoteContract(self);
  }

  const updateTitle = (self.isModified('url') || !self.isModified('title'))
    && !self.title;
  const updateDescription = (self.isModified('url') || !self.isModified('description'))
    && !self.description;
  const updateImage = (self.isModified('url') || !self.isModified('image'))
    && !self.image;

  if (!updateTitle && !updateDescription && !updateImage) {
    next(null);
  }

  try {
    const meta = await promise((...c)=>metafetch.fetch(...c))(
      self.url,
      {
        flags: { images: false, links: false },
        http: { timeout: 30000 },
      }
    );

    if (updateTitle) {
      self.title = meta.title;
    }
    if (updateDescription) {
      self.description = meta.description;
    }
    if (updateImage) {
      self.image = meta.image;
    }

    if (!self.status) {
      self.status = 'initializing';
      try {
        await pushVoteOnQueue(self);
      } catch (queueErr) {
        logger.error(queueErr);
        return next(new Error(queueErr));
      }
    }
  } catch (metafetchErr) {
    logger.error(metafetchErr);
    return next(new Error(metafetchErr));
  }

  return next();
});

function getTypesFromAbi(abi, functionName) {

  function matchesFunctionName(json) {
    return (json.name === functionName && json.type === 'function');
  }

  function getTypes(json) {
    return json.type;
  }

  const funcJson = abi.filter(matchesFunctionName)[0];

  return (funcJson.inputs).map(getTypes);
}

Vote.schema.methods.getProofOfVote = function(tx) {
  const params = SolidityCoder.decodeParams(
    getTypesFromAbi(JSON.parse(this.voteContractABI), 'vote'),
    // the parameter value is in the last byte of the tx data
    tx.data.slice(tx.data.length - 1).toString('hex')
  );

  // We intend to embed this in a QR code. The lighter the JSON, the lighter the
  // QR code. And the lighter the QR code, the easier it is to read.
  return jwt.sign(
    {
      v: 1.0, // version
      a: tx.from.toString('hex'), // address
      c: tx.to.toString('hex'), // contract
      p: ~~params[0].toNumber(), // proposal
      t: Date.now(), // date
    },
    this.key,
    {
      noTimestamp: true,
    }
  );
}

transform.toJSON(Vote, (vote) => {
  delete vote.salt;
  delete vote.key;
});

Vote.defaultColumns = 'title, url, status, voteContractAddress, createdAt';
Vote.register();
