var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');
var metafetch = require('metafetch');
var async = require('async');
var Web3 = require('web3');
var bcrypt = require('bcrypt');

var Ballot = keystone.list('Ballot');

var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
  autokey: { path: 'slug', from: 'title', unique: true },
  // map: { name: 'title' },
  track: { createdAt: true, updatedAt: true },
  sortable: true,
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
  salt: { type: Types.Text, noedit: true, default: () => bcrypt.genSaltSync(10) },
});

Vote.relationship({ path: 'sources', ref: 'Source', refPath: 'vote' });

Vote.schema.methods.userIsAuthorizedToVote = function(user) {
  return config.capabilities.vote.enabled
    && this.status === 'open'
    && !!this.voteContractAddress
    && !!this.voteContractABI
    && !!user
    && (!this.restricted || (!!user.iss && user.iss === this.app))
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

function completeVote(vote, next) {
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
      (accounts, instance, callback) => instance.end
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

        var voteMsg = { vote : { id : vote.id } };

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
    return next();
  }

  if (self.isModified('status') && self.status === 'complete') {
    return completeVote(self, next);
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
          self.title = meta.title;
          self.description = meta.description;
          self.image = meta.image;

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

transform.toJSON(Vote, (vote) => {
  delete vote.salt;
});

Vote.defaultColumns = 'title, url, status, voteContractAddress';
Vote.register();
