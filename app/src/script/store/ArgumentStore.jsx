var Reflux = require('reflux');
var jquery = require('jquery');

var ArgumentAction = require('../action/ArgumentAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(ArgumentAction.showBillArguments, this._fetchArgumentsByBillId);
        this.listenTo(ArgumentAction.like, this._likeHandler);
        this.listenTo(ArgumentAction.add, this._addHandler);

        this._arguments = {};
    },

    getArgumentById: function(argumentId)
    {
        for (var billId in this._arguments)
            if (this._arguments[billId] !== true)
                for (var arg of this._arguments[billId])
                    if (arg.id == argumentId)
                        return arg;

        return null;
    },

    getArgumentsByBillId: function(billId)
    {
        if (this._arguments[billId] && this._arguments[billId] !== true)
            return this._arguments[billId];

        return null;
    },

    billArgumentLoading: function(billId)
    {
        return this._arguments[billId] === true;
    },

    _fetchArgumentsByBillId: function(billId)
    {
        if (this._arguments[billId])
        {
            this.trigger(this);
            return false;
        }

        this._arguments[billId] = true;

        jquery.get(
            '/api/argument/list/' + billId,
            (data) => {
                this._arguments[billId] = data.arguments;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._arguments[billId] = { error: xhr.status };
            this.trigger(this, this._arguments[billId]);
        });

        return true;
    },

    _likeHandler: function(argument, value)
    {
        if (argument.likes && argument.likes.length)
        {
            var oldValue = argument.likes[0].value;

            jquery.get(
                '/api/argument/like/remove/' + argument.id,
                (data) => {
                    argument.likes = [];
                    argument.score += data.like.value ? -1 : 1;

                    if (value != oldValue)
                        this._addLike(argument, value);

                    this.trigger(this);
                }
            ).error((xhr, billStatus, err) => {
                this.trigger(this);
            });
        }
        else
            this._addLike(argument, value);
    },

    _addLike: function(argument, value)
    {
        jquery.get(
            '/api/argument/like/add/' + argument.id + '/' + value,
            (data) => {
                argument.likes = [data.like];
                argument.score += data.like.value ? 1 : -1;

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    },

    _addHandler: function(billId, value, title, content)
    {
        jquery.post(
            '/api/argument/add',
            {
                billId  : billId,
                value   : value,
                title   : title,
                content : content
            },
            (data) => {
                this._arguments[billId].push(data.argument);

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this.trigger(this);
        });
    }
});
