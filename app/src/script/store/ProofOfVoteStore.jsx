var Reflux = require('reflux');
var jquery = require('jquery');

var ProofOfVoteAction = require('../action/ProofOfVoteAction');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(ProofOfVoteAction.verify, this._verify);

    this._status = {};
  },

  getInitialState: function() {
    return this;
  },

  getStatus(proofOfVote) {
    return proofOfVote in this._status
      ? this._status[proofOfVote]
      : false;
  },

  _verify: function(proofOfVote) {
    if (proofOfVote in this._status
        && this._status[proofOfVote] === 'pending') {
      return;
    }

    if (proofOfVote in this._status) {
      this.trigger(this);
      return;
    }

    this._status[proofOfVote] = 'pending';

    jquery.post(
      '/api/ballot/verify',
      { proofOfVote: proofOfVote },
      (data) => {
        this._status[proofOfVote] = data.status;
        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._status[proofOfVote] = { error : xhr.status };
    });
  },
});
