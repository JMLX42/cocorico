var Reflux = require('reflux');
var jquery = require('jquery');

var TextAction = require('../action/TextAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(TextAction.showSources, this._fetchSourcesByTextId);
        this.listenTo(TextAction.save, this._textSaveHandler);
        this.listenTo(TextAction.addSource, this._addSourceHandler);

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
    }
});
