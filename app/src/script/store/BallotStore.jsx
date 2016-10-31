var Reflux = require('reflux');
var jquery = require('jquery');
var lightwallet = require('eth-lightwallet');
var async = require('async');
var qr = require('qr-image');

var BallotAction = require('../action/BallotAction');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(BallotAction.send, this._vote);
    // this.listenTo(BallotAction.cancel, this._unvote);
    this.listenTo(BallotAction.startPolling, this._startPollingBallot);
    this.listenTo(BallotAction.stopPolling, this._stopPollingBallot);
    this.listenTo(BallotAction.showCurrentUserBallot, this._fetchByVoteId);

    this._ballots = {};
    this._proofOfVote = {};
    this._loadingBallot = {};
    this._ballotPolling = {};
  },

  getInitialState: function() {
    return this;
  },

  getByVoteId: function(voteId) {
    return this._ballots[voteId];
  },

  getProofOfVoteSVGByVoteId: function(voteId) {
    var data = this._proofOfVote[voteId];

    if (!data) {
      return null;
    }

    var svg = qr.imageSync(data, { type: 'svg', ec_level: 'M' });

    return svg.replace('</svg>', '<desc>' + data + '</desc></svg>');
  },

  _fetchByVoteId: function(voteId, forceUpdate) {
    if (voteId in this._loadingBallot) {
      return false;
    }

    if (this._ballots[voteId] && !forceUpdate) {
      this.trigger(this);
      return false;
    }

    this._loadingBallot[voteId] = true;

    jquery.get(
      '/api/ballot/' + voteId,
      (data) => {
        // To simplify error handling, Ballot.error must be easily casted to
        // a boolean. So if the Ballot.error array is empty, we simply delete
        // the field.
        if (Array.isArray(data.ballot.error) && data.ballot.error.length === 0) {
          delete data.ballot.error;
        }

        this._ballots[voteId] = data.ballot;
        delete this._loadingBallot[voteId];

        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._ballots[voteId] = { error: xhr.status };
      delete this._loadingBallot[voteId];

      this.trigger(this, this._ballots[voteId]);
    });

    return true;
  },

  _getVoteTransaction: function(keystore,
                                pwDerivedKey,
                                address,
                                voteContractAddress,
                                voteContractABI,
                                value) {
    console.log('creating vote transaction with value', value);

    var tx = lightwallet.txutils.functionTx(
      JSON.parse(voteContractABI),
      'vote',
      [value],
      {
        to: voteContractAddress,
        gasLimit: 999999,
        gasPrice: 20000000000,
        nonce: 0,
      }
    );

    console.log('tx', tx);

    var signedTx = '0x' + lightwallet.signing.signTx(
      keystore,
      pwDerivedKey,
      tx,
      address
    );

    console.log('signed tx', signedTx);

    return signedTx;
  },

  _vote: function(keystore, pwDerivedKey, address, vote, value) {
    var tx = this._getVoteTransaction(
      keystore,
      pwDerivedKey,
      address,
      vote.voteContractAddress,
      vote.voteContractABI,
      value
    );

    jquery.post(
      '/api/ballot/' + vote.id,
      {
        transaction: tx,
        // voterCardHash: bcrypt.hashSync(keystore.serialize(), 10),
      },
      (data) => {
        console.log('ballot transaction sent');
        this._ballots[vote.id] = data.ballot;
        this._proofOfVote[vote.id] = data.proof;
        this.trigger(this);
      }
    );
  },

  // _removeVote: function(keystore, voteId, callback) {
  //   jquery.post(
  //     '/api/ballot/cancel/' + voteId,
  //     {
  //       // voterCardHash: keystore
  //       //     ? bcrypt.hashSync(keystore.serialize(), 10)
  //       //     : null,
  //       transaction: null, // FIXME: generate the actual blockchain transaction
  //     },
  //     (data) => {
  //       // No ballot object => ballot is loading. To make sure the
  //       // removed ballot does not make the app hang waiting for a
  //       // ballot object, we create a dummy ballot object with an error
  //       // state.
  //       this._ballots[voteId] = {status:'cancelled'};
  //
  //       if (callback)
  //         callback(data);
  //     }
  //   );
  // },

  // _unvote: function(keystore, voteId) {
  //   this._removeVote(keystore, voteId, (data) => this.trigger(this));
  // },

  _startPollingBallot: function(voteId) {
    if (this._isPollingBallot(voteId))
      return;

    this._ballotPolling[voteId] = true;

    console.log('start polling ballot for vote ' + voteId);

    async.whilst(
      () => {
        return this._isPollingBallot(voteId);
      },
      (callback) => {
        this._fetchByVoteId(voteId, true);
        this._ballotPolling[voteId] = setTimeout(callback, 10000);
      },
      (err) => {
        this._stopPollingBallot(voteId);
      }
    );
  },

  _isPollingBallot: function(voteId) {
    return voteId in this._ballotPolling;
  },

  _stopPollingBallot: function(voteId) {
    if (this._isPollingBallot(voteId)) {
      console.log('stop polling ballot for vote ' + voteId);

      if (this._ballotPolling[voteId] !== true)
        clearTimeout(this._ballotPolling[voteId]);

      delete this._ballotPolling[voteId];
    }
  },
});
