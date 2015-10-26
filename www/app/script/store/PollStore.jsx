var Reflux = require('reflux')
var PollAction = require("../action/PollAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(PollAction.list, this._fetchPolls);
        this.listenTo(PollAction.showLatest, this._fetchLatest);
        this.listenTo(PollAction.show, this._fetchPollBySlug);

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

    getBySlug: function(slug)
    {
        for (var poll of this._polls)
            if (poll.slug == slug)
                return poll;

        return null;
    },

    _fetchLatest: function()
    {
        jquery.get(
            '/api/poll/latest',
            (data) => {
                this._latest = data.poll;
                this.trigger(this);
            }
        );
    },

    _fetchPolls: function()
    {
        jquery.get(
            '/api/poll/list',
            (data) => {
                this._polls = data.polls;
                this.trigger(this);
            }
        );
    },

    _fetchPollBySlug: function(slug)
    {
        if (this.getBySlug(slug))
        {
            this.trigger(this);
            return;
        }

        jquery.get(
            '/api/poll/getBySlug/' + slug,
            (data) => {
                this._polls.push(data.poll);
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._polls.push({ slug: slug, error: xhr.status });
            this.trigger(this);
        });;
    }
});
