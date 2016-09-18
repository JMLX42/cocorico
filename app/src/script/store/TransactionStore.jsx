var Reflux = require('reflux');
var jquery = require('jquery');
var lightwallet = require('eth-lightwallet');
var async = require('async');
// var bcrypt = require('bcryptjs');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        jquery.ajaxSetup({ cache: false });

        this.listenTo(VoteAction.getTransactions, this._fetchByVoteId);

        this._transactions = {};
    },

    getInitialState: function()
    {
        return this;
    },

    getByVoteId: function(voteId)
    {
        return this._transactions[voteId] === true
            ? null
            : this._transactions[voteId];
    },

    _fetchByVoteId: function(voteId)
    {
        if (voteId in this._transactions && this._transactions[voteId] === true) {
            return;
        }

        if (voteId in this._transactions) {
            this.trigger(this);
            return;
        }

        this._transactions[voteId] = true;

        jquery.get(
            '/api/vote/transactions/' + voteId,
            (data) => {
                this._transactions[voteId] = data.transactions;

                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this._transactions[voteId] = { error: xhr.status };

            this.trigger(this);
        });
    }

});
