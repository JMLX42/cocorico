var Reflux = require('reflux');
var jquery = require('jquery');

var PollAction = require('../action/PollAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(PollAction.vote, this._vote);
        this.listenTo(PollAction.unvote, this._unvote);
        this.listenTo(PollAction.showCurrentUserVote, this._fetchVoteByPollId);

        this._votes = {};
    },

    getVoteByPollId: function(pollId)
    {
        if (this._votes[pollId])
            return this._votes[pollId];

        return null;
    },

    _fetchVoteByPollId: function(pollId)
    {
        if (this._votes[pollId])
        {
            this.trigger(this);
            return false;
        }

        this._votes[pollId] = true;

        jquery.get(
            '/api/poll/vote/' + pollId,
            (data) => {
                this._votes[pollId] = data.vote;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._votes[pollId] = { error: xhr.status };
            this.trigger(this);
        });

        return true;
    },

    _vote: function(pollId, value)
    {
        jquery.get(
            '/api/poll/vote/' + value + '/' + pollId,
            (data) => {
                delete this._votes[pollId];
                this.trigger(this);
            }
        );
    },

    _unvote: function(pollId, value)
    {
        jquery.get(
            '/api/poll/unvote/' + pollId,
            (data) => {
                delete this._votes[pollId];
                this.trigger(this);
            }
        );
    }
});
