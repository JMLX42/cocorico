var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.showTextVoteResult, this._showTextVoteResultHandler);

        this._result = {};
        this._resultPerGender = {};
        this._resultPerAge = {};
        this._resultPerDate = {};
    },

    getVoteResultByTextId: function(textId)
    {
        if (this._result[textId] && this._result[textId] !== true)
            return this._result[textId];

        return null;
    },

    getVoteResultPerDateByTextId: function(textId)
    {
        if (this._resultPerDate[textId] && this._resultPerDate[textId] !== true)
            return this._resultPerDate[textId];

        return null;
    },

    getVoteResultPerGenderByTextId: function(textId)
    {
        if (this._resultPerGender[textId] && this._resultPerGender[textId] !== true)
            return this._resultPerGender[textId];

        return null;
    },

    getVoteResultPerAgeByTextId: function(textId)
    {
        if (this._resultPerAge[textId] && this._resultPerAge[textId] !== true)
            return this._resultPerAge[textId];

        return null;
    },

    _showTextVoteResultHandler: function(textId)
    {
        this._fetchVoteResult(textId, this._result, '/api/vote/result/');
        this._fetchVoteResult(textId, this._resultPerGender, '/api/vote/result/per-gender/');
        this._fetchVoteResult(textId, this._resultPerAge, '/api/vote/result/per-age/');
        this._fetchVoteResult(textId, this._resultPerDate, '/api/vote/result/per-date/');
    },

    _fetchVoteResult: function(textId, collection, endpoint)
    {
        if (collection[textId])
        {
            if (collection[textId] !== true)
                this.trigger(this);

            return;
        }

        collection[textId] = true;

        jquery.get(
            endpoint + textId,
            (data) => {
                collection[textId] = data.result;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            collection[textId] = { error : xhr.status };
            this.trigger(this, collection[textId]);
        });
    }
});
