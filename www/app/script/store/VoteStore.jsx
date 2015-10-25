var Reflux = require('reflux');
var jquery = require('jquery');

var PollAction = require('../action/PollAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(PollAction.vote, this._vote);
        this.listenTo(PollAction.show, this._fetchVoteByPoll);

        this._votes = {};
    },

    getVoteByPollId: function(pollId)
    {
        if (this._votes[pollId])
            return this._votes[pollId];

        return null;
    },

    _fetchVoteByPoll: function(poll)
    {
        if (this._votes[poll.id])
            return false;

        this._votes[poll.id] = true;

        jquery.get(
            '/api/poll/vote/' + poll.id,
            (data) => {
                this._votes[poll.id] = data.vote;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            delete this._votes[poll.id];
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
    }
});
