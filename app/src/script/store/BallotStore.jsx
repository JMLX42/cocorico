var Reflux = require('reflux');
var jquery = require('jquery');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.vote, this._vote);
        this.listenTo(VoteAction.unvote, this._unvote);
        this.listenTo(BillAction.showCurrentUserVote, this._fetchBallotByBillId);

        this._ballots = {};
    },

    getBallotByBillId: function(billId)
    {
        if (this._ballots[billId])
            return this._ballots[billId];

        return null;
    },

    _fetchBallotByBillId: function(billId, noCache)
    {
        if (this._ballots[billId] && !noCache)
        {
            this.trigger(this);
            return false;
        }

        this._ballots[billId] = true;

        jquery.get(
            '/api/bill/ballot/' + billId,
            (data) => {
                this._ballots[billId] = data.ballot;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._ballots[billId] = { error: xhr.status };
            this.trigger(this, this._ballots[billId]);
        });

        return true;
    },

    _vote: function(billId, value)
    {
        jquery.get(
            '/api/vote/' + value + '/' + billId,
            (data) => {
                this._ballots[billId] = data.ballot;
                this.trigger(this);
            }
        );
    },

    _unvote: function(billId, value)
    {
        jquery.get(
            '/api/vote/remove/' + billId,
            (data) => {
                delete this._ballots[billId];
                this.trigger(this);
            }
        );
    }
});
