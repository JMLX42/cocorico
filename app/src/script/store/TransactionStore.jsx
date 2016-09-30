var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
  init: function() {
    jquery.ajaxSetup({ cache: false });

    this.listenTo(VoteAction.getTransactions, this._fetchByVoteId);
    this.listenTo(VoteAction.searchTransactions, this._fetchByVoteId);

    this._transactions = {};
  },

  getInitialState: function() {
    return this;
  },

  getByVoteId: function(voteId) {
    return this._transactions[voteId] === true
      ? null
      : this._transactions[voteId];
  },

  _fetchByVoteId: function(voteId, search) {
    if (voteId in this._transactions && this._transactions[voteId] === true) {
      return;
    }

    if (!search && voteId in this._transactions) {
      this.trigger(this);
      return;
    }

    this._transactions[voteId] = true;

    jquery.post(
      '/api/vote/transactions/' + voteId,
      {
        transactionHash: search ? search.transactionHash : null,
        voter: search ? search.voter : null,
        proposal: search ? search.proposal : null,
      },
      (data) => {
        this._transactions[voteId] = data.transactions;

        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._transactions[voteId] = { error: xhr.status };

      this.trigger(this);
    });
  },

});
