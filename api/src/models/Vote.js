var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');
var metafetch = require('metafetch');
var async = require('async');
var Web3 = require('web3');
var bcrypt = require('bcrypt');
var srs = require('secure-random-string');
var SolidityCoder = require('web3/lib/solidity/coder');
var jwt = require('jsonwebtoken');

var Ballot = keystone.list('Ballot');

var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
  autokey: { path: 'slug', from: 'title', unique: true },
  // map: { name: 'title' },
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
    hash: bcrypt.hashSync(uid, this.salt),
  });
}

Vote.schema.methods.getBallotByUserUID = function(uid, callback) {
  Ballot.model.findOne({hash: bcrypt.hashSync(uid, this.salt)}).exec(callback);
}

function closeVoteContract(vote, next) {
  if (!vote.voteContractAddress) {
    next(null);
  }

  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(
    'http://127.0.0.1:8545'
  ));

  async.waterfall(
    [
      (callback) => web3.eth.getAccounts(callback),
      (accounts, callback) => web3.eth.contract(
        JSON.parse(vote.voteContractABI)
      )
      .at(
        vote.voteContractAddress,
        (err, instance) => callback(err, accounts, instance)
      ),
      (accounts, instance, callback) => instance.close
        .sendTransaction({from: accounts[0]}, (err, txhash) => {
          callback(err, txhash);
        }),
    ],
    (err, txhash) => {
      next(err);
    }
  );
}

function pushVoteOnQueue(vote, callback) {
  require('amqplib/callback_api').connect(
    'amqp://localhost',
    (err, conn) => {
      if (err != null)
        return callback(err, null);

      return conn.createChannel((channelErr, ch) => {
        if (channelErr != null)
          return callback(channelErr, null);

        var voteMsg = { vote : {
          id: vote.id,
          numProposals: vote.labels.length === 0 ? 3 : vote.labels.length,
        } };

        ch.assertQueue('votes');
        ch.sendToQueue(
          'votes',
          new Buffer(JSON.stringify(voteMsg)),
          { persistent : true }
        );

        return callback(null, voteMsg);
      });
    }
	);
}

Vote.schema.pre('validate', function(next) {
  var self = this;

  if (!self.url) {
    return next(null);
  }

  if (self.isModified('status') && self.status === 'complete') {
    return closeVoteContract(self, next);
  }

  var updateTitle = (self.isModified('url') || !self.isModified('title'))
    && !self.title;
  var updateDescription = (self.isModified('url') || !self.isModified('description'))
    && !self.description;
  var updateImage = (self.isModified('url') || !self.isModified('image'))
    && !self.image;

  if (!updateTitle && !updateDescription && !updateImage) {
    next(null);
  }

  return async.waterfall(
    [
      (callback) => !metafetch.fetch(
        self.url,
        {
          flags: { images: false, links: false },
          http: { timeout: 30000 },
        },
        (err, meta) => {
          if (err) {
            callback(new Error(err));
            return;
          }

          if (updateTitle) {
            self.title = meta.title;
          }
          if (updateDescription) {
            self.description = meta.description;
          }
          if (updateImage) {
            self.image = meta.image;
          }

          callback(null);
        }
      ),
      (callback) => {
        if (!self.status) {
          self.status = 'initializing';
          pushVoteOnQueue(self, (err, msg) => callback(err));
        } else {
          callback(null);
        }
      },
    ],
    (err) => {
      next(err);
    }
  );
});

function getTypesFromAbi(abi, functionName) {

  function matchesFunctionName(json) {
    return (json.name === functionName && json.type === 'function');
  }

  function getTypes(json) {
    return json.type;
  }

  var funcJson = abi.filter(matchesFunctionName)[0];

  return (funcJson.inputs).map(getTypes);
}

Vote.schema.methods.getProofOfVote = function(tx) {
  var params = SolidityCoder.decodeParams(
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
