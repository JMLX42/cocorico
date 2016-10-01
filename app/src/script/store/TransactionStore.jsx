var Reflux = require('reflux');
var jquery = require('jquery');

var BallotAction = require('../action/BallotAction');

module.exports = Reflux.createStore({
  init: function() {
    jquery.ajaxSetup({ cache: false });

    this.listenTo(BallotAction.getTransactions, this._fetchByVoteId);
    this.listenTo(BallotAction.searchTransactions, this._fetchByVoteId);

    this._transactions = {};
    this._numPages = {};
    this._numItems = {};
  },

  getInitialState: function() {
    return this;
  },

  getNumPagesByVoteId: function(voteId) {
    return voteId in this._numPages ? this._numPages[voteId] : 0;
  },

  getNumItemsByVoteId: function(voteId) {
    return voteId in this._numItems ? this._numItems[voteId] : 0;
  },

  getByVoteId: function(voteId, page) {
    return !(voteId in this._transactions) || this._transactions[voteId][page] === true
      ? null
      : this._transactions[voteId][page];
  },

  _fetchByVoteId: function(voteId, page, search) {
    if (voteId in this._transactions && this._transactions[voteId][page] === true) {
      return;
    }

    if (!search && voteId in this._transactions) {
      this.trigger(this);
      return;
    }

    this._transactions[voteId] = [];
    this._transactions[voteId][page] = true;

    jquery.post(
      '/api/ballot/transactions/' + voteId,
      {
        page: page,
        transactionHash: search ? search.transactionHash : null,
        voter: search ? search.voter : null,
        proposal: search ? search.proposal : null,
      },
      (data) => {
        this._transactions[voteId][data.page] = data.transactions;
        this._numPages[voteId] = data.numPages;
        this._numItems[voteId] = data.numItems;

        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._transactions[voteId] = { error: xhr.status };

      this.trigger(this);
    });
  },

});
