var Reflux = require('reflux');
var jquery = require('jquery');

var ProofOfVoteAction = require('../action/ProofOfVoteAction');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(ProofOfVoteAction.verify, this._verify);

    this._verified = {};
  },

  getInitialState: function() {
    return this;
  },

  getVerifiedBallot(proofOfVote) {
    return proofOfVote in this._verified && this._verified[proofOfVote] !== true
      ? this._verified[proofOfVote]
      : false;
  },

  _verify: function(proofOfVote) {
    if (proofOfVote in this._verified
        && this._verified[proofOfVote] === true) {
      return;
    }

    if (proofOfVote in this._verified) {
      this.trigger(this);
      return;
    }

    this._verified[proofOfVote] = true;

    jquery.post(
      '/api/ballot/verify',
      { proofOfVote: proofOfVote },
      (data) => {
        this._verified[proofOfVote] = data.verified;
        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._verified[proofOfVote] = { error : xhr.status };
    });
  },
});
