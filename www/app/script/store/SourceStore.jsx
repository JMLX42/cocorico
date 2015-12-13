var Reflux = require('reflux');
var jquery = require('jquery');

var TextAction = require('../action/TextAction'),
    SourceAction = require('../action/SourceAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(TextAction.showSources, this._fetchSourcesByTextId);
        this.listenTo(TextAction.save, this._textSaveHandler);
        this.listenTo(TextAction.addSource, this._addSourceHandler);
        this.listenTo(SourceAction.like, this._likeHandler);
        this.listenTo(SourceAction.removeLike, this._removeLikeHandler);

        this._sources = {};

        this.clearError();
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
        for (var textId in this._sources)
            for (var source of this._sources[textId])
                if (source.id == sourceId)
                    return source;

        return null;
    },

    getSourcesByTextId: function(textId)
    {
        if (this._sources[textId])
            return this._sources[textId];

        return null;
    },

    _fetchSourcesByTextId: function(textId)
    {
        this.clearError();

        if (this._sources[textId])
        {
            this.trigger(this);
            return false;
        }

        this._sources[textId] = true;

        jquery.get(
            '/api/source/list/' + textId,
            (data) => {
                this._sources[textId] = data.sources;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._sources[textId] = { error: xhr.status };
            this.trigger(this);
        });

        return true;
    },

    _textSaveHandler: function(textId, title, content)
    {
        delete this._sources[textId];
    },

    _addSourceHandler: function(textId, url)
    {
        this.clearError();

        jquery.post(
            '/api/source/add/',
            {
                textId: textId,
                url: url
            },
            (data) => {
                this._sources[textId].push(data.source);
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._error = xhr.responseJSON;
            this.trigger(this);
        });
    },

    _likeHandler: function(sourceId, value)
    {
        jquery.get(
            '/api/source/like/add/' + sourceId + '/' + value,
            (data) => {
                var source = this.getSourceById(sourceId);

                source.likes = [data.like];
                source.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    },

    _removeLikeHandler: function(sourceId)
    {
        jquery.get(
            '/api/source/like/remove/' + sourceId,
            (data) => {
                var source = this.getSourceById(sourceId);

                source.likes = [];
                source.score += data.like.value ? -1 : 1;

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    }
});
