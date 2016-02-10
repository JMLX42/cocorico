var Reflux = require('reflux');
var jquery = require('jquery');

var BillAction = require('../action/BillAction'),
    SourceAction = require('../action/SourceAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(BillAction.showSources, this._fetchSourcesByBillId);
        this.listenTo(BillAction.save, this._billSaveHandler);
        this.listenTo(BillAction.addSource, this._addSourceHandler);
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
        for (var billId in this._sources)
            if (this._sources[billId] !== true)
                for (var source of this._sources[billId])
                    if (source.id == sourceId)
                        return source;

        return null;
    },

    getSourcesByBillId: function(billId)
    {
        if (this._sources[billId] && this._sources[billId] !== true)
            return this._sources[billId];

        return null;
    },

    billSourceLoading: function(billId)
    {
        return this._sources[billId] === true;
    },

    _fetchSourcesByBillId: function(billId)
    {
        this.clearError();

        if (this._sources[billId])
        {
            this.trigger(this);
            return false;
        }

        this._sources[billId] = true;

        jquery.get(
            '/api/source/list/' + billId,
            (data) => {
                this._sources[billId] = data.sources;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._sources[billId] = { error: xhr.status };
            this.trigger(this);
        });

        return true;
    },

    _billSaveHandler: function(billId, title, content)
    {
        delete this._sources[billId];
    },

    _addSourceHandler: function(billId, url)
    {
        this.clearError();

        jquery.post(
            '/api/source/add/',
            {
                billId: billId,
                url: url
            },
            (data) => {
                this._sources[billId].push(data.source);
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
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
            ).error((xhr, billStatus, err) => {
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
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    }
});
