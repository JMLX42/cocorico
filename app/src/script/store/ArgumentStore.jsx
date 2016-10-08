var Reflux = require('reflux');
var jquery = require('jquery');

var ArgumentAction = require('../action/ArgumentAction');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(ArgumentAction.showVoteArguments, this._fetchArgumentsByVoteId);
    this.listenTo(ArgumentAction.like, this._likeHandler);
    this.listenTo(ArgumentAction.add, this._addHandler);

    this._arguments = {};
  },

  getArgumentById: function(argumentId) {
    for (var voteId in this._arguments)
      if (this._arguments[voteId] !== true)
        for (var arg of this._arguments[voteId])
          if (arg.id === argumentId)
            return arg;

    return null;
  },

  getArgumentsByVoteId: function(voteId) {
    if (this._arguments[voteId] && this._arguments[voteId] !== true)
      return this._arguments[voteId];

    return null;
  },

  voteArgumentLoading: function(voteId) {
    return this._arguments[voteId] === true;
  },

  _fetchArgumentsByVoteId: function(voteId) {
    if (this._arguments[voteId]) {
      this.trigger(this);
      return false;
    }

    this._arguments[voteId] = true;

    jquery.get(
            '/api/argument/list/' + voteId,
            (data) => {
              this._arguments[voteId] = data.arguments;
              this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
          this._arguments[voteId] = { error: xhr.status };
          this.trigger(this, this._arguments[voteId]);
        });

    return true;
  },

  _likeHandler: function(argument, value) {
    if (argument.likes && argument.likes.length) {
      var oldValue = argument.likes[0].value;

      jquery.get(
        '/api/argument/like/remove/' + argument.id,
        (data) => {
          argument.likes = [];
          argument.score += data.like.value ? -1 : 1;

          if (value !== oldValue)
            this._addLike(argument, value);

          this.trigger(this);
        }
      ).error((xhr, voteStatus, err) => {
        this.trigger(this);
      });
    } else {
      this._addLike(argument, value);
    }
  },

  _addLike: function(argument, value) {
    jquery.get(
      '/api/argument/like/add/' + argument.id + '/' + value,
      (data) => {
        argument.likes = [data.like];
        argument.score += data.like.value ? 1 : -1;

        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this.trigger(this);
    });
  },

  _addHandler: function(voteId, value, title, content) {
    jquery.post(
      '/api/argument/add',
      {
        voteId  : voteId,
        value   : value,
        title   : title,
        content : content,
      },
      (data) => {
        this._arguments[voteId].push(data.argument);

        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this.trigger(this);
    });
  },
});
