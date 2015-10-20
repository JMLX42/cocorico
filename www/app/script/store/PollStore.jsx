var Reflux = require('reflux')
var PollAction = require("../action/PollAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(PollAction.list, this.fetchPolls);
        this.listenTo(PollAction.showLatest, this.fetchLatest);

        this._polls = [];
        this._latest = null;
    },

    get: function()
    {
        return this._polls;
    },

    latest: function()
    {
        return this._latest;
    },

    fetchLatest: function()
    {
        self = this;

        jquery.get(
            '/api/poll/latest',
            function(data)
            {
                self._latest = data.poll;
                self.trigger(self);
            }
        );
    },

    fetchPolls: function()
    {
        self = this;

        jquery.get(
            '/api/poll/list',
            function(data)
            {
                self._polls = data.polls;
                self.trigger(self);
            }
        );
    }
});
