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
            if (this._sources[textId] !== true)
                for (var source of this._sources[textId])
                    if (source.id == sourceId)
                        return source;

        return null;
    },

    getSourcesByTextId: function(textId)
    {
        if (this._sources[textId] && this._sources[textId] !== true)
            return this._sources[textId];

        return null;
    },

    textSourceLoading: function(textId)
    {
        return this._sources[textId] === true;
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
            ).error((xhr, textStatus, err) => {
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
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    }
});
