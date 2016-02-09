var Reflux = require('reflux');
var jquery = require('jquery');

var ArgumentAction = require('../action/ArgumentAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(ArgumentAction.showTextArguments, this._fetchArgumentsByTextId);
        this.listenTo(ArgumentAction.like, this._likeHandler);
        this.listenTo(ArgumentAction.add, this._addHandler);

        this._arguments = {};
    },

    getArgumentById: function(argumentId)
    {
        for (var textId in this._arguments)
            if (this._arguments[textId] !== true)
                for (var arg of this._arguments[textId])
                    if (arg.id == argumentId)
                        return arg;

        return null;
    },

    getArgumentsByTextId: function(textId)
    {
        if (this._arguments[textId] && this._arguments[textId] !== true)
            return this._arguments[textId];

        return null;
    },

    textArgumentLoading: function(textId)
    {
        return this._arguments[textId] === true;
    },

    _fetchArgumentsByTextId: function(textId)
    {
        if (this._arguments[textId])
        {
            this.trigger(this);
            return false;
        }

        this._arguments[textId] = true;

        jquery.get(
            '/api/argument/list/' + textId,
            (data) => {
                this._arguments[textId] = data.arguments;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._arguments[textId] = { error: xhr.status };
            this.trigger(this, this._arguments[textId]);
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
            ).error((xhr, textStatus, err) => {
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
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    },

    _addHandler: function(textId, value, title, content)
    {
        jquery.post(
            '/api/argument/add',
            {
                textId  : textId,
                value   : value,
                title   : title,
                content : content
            },
            (data) => {
                this._arguments[textId].push(data.argument);

                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this.trigger(this);
        });
    }
});
