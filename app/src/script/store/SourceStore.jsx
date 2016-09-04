var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction'),
    SourceAction = require('../action/SourceAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(SourceAction.show, this._fetchSourcesByVoteId);
        this.listenTo(SourceAction.like, this._likeHandler);

        this._sources = {};

        this.clearError();
    },

    getInitialState: function() {
        return this;
    },

    getError: function()
    {
        return this._error;
    },

    clearError: function()
    {
        this._error = null;
    },

    getSourceById: function(sourceId)
    {
        for (var voteId in this._sources)
            if (this._sources[voteId] !== true)
                for (var source of this._sources[voteId])
                    if (source.id == sourceId)
                        return source;

        return null;
    },

    getSourcesByVoteId: function(voteId)
    {
        if (this._sources[voteId] && this._sources[voteId] !== true)
            return this._sources[voteId];

        return null;
    },

    voteSourceLoading: function(voteId)
    {
        return this._sources[voteId] === true;
    },

    _fetchSourcesByVoteId: function(voteId)
    {
        this.clearError();

        if (this._sources[voteId])
        {
            this.trigger(this);
            return false;
        }

        this._sources[voteId] = true;

        jquery.get(
            '/api/source/' + voteId,
            (data) => {
                this._sources[voteId] = data.sources;
                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this._sources[voteId] = { error: xhr.status };
            this.trigger(this);
        });

        return true;
    },

    _likeHandler: function(source, value)
    {
        if (source.likes && source.likes.length)
        {
            var oldValue = source.likes[0].value;

            jquery.get(
                '/api/source/like/remove/' + source.id,
                (data) => {
                    source.likes = [];
                    source.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addLike(source, value);

                    this.trigger(this);
                }
            ).error((xhr, voteStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addLike(source, value);
    },

    _addLike: function(source, value)
    {
        jquery.get(
            '/api/source/like/add/' + source.id + '/' + value,
            (data) => {
                source.likes = [data.like];
                source.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this.trigger(this);
        });
    }
});
