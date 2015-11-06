var Reflux = require('reflux');
var jquery = require('jquery');

var TextAction = require('../action/TextAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(TextAction.vote, this._vote);
        this.listenTo(TextAction.unvote, this._unvote);
        this.listenTo(TextAction.showCurrentUserVote, this._fetchBallotByTextId);

        this._ballots = {};
    },

    getBallotByTextId: function(textId)
    {
        if (this._ballots[textId])
            return this._ballots[textId];

        return null;
    },

    _fetchBallotByTextId: function(textId)
    {
        if (this._ballots[textId])
        {
            this.trigger(this);
            return false;
        }

        this._ballots[textId] = true;

        jquery.get(
            '/api/text/ballot/' + textId,
            (data) => {
                this._ballots[textId] = data.ballot;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._ballots[textId] = { error: xhr.status };
            this.trigger(this, this._ballots[textId]);
        });

        return true;
    },

    _vote: function(textId, value)
    {
        jquery.get(
            '/api/text/vote/' + value + '/' + textId,
            (data) => {
                this._ballots[textId] = data.ballot;
                this.trigger(this);
            }
        );
    },

    _unvote: function(textId, value)
    {
        jquery.get(
            '/api/text/unvote/' + textId,
            (data) => {
                delete this._ballots[textId];
                this.trigger(this);
            }
        );
    }
});
