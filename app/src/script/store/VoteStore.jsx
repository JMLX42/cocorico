var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.showBillVoteResult, this._showBillVoteResultHandler);

        this._result = {};
        this._resultPerGender = {};
        this._resultPerAge = {};
        this._resultPerDate = {};
    },

    getVoteResultByBillId: function(billId)
    {
        if (this._result[billId] && this._result[billId] !== true)
            return this._result[billId];

        return null;
    },

    getVoteResultPerDateByBillId: function(billId)
    {
        if (this._resultPerDate[billId] && this._resultPerDate[billId] !== true)
            return this._resultPerDate[billId];

        return null;
    },

    getVoteResultPerGenderByBillId: function(billId)
    {
        if (this._resultPerGender[billId] && this._resultPerGender[billId] !== true)
            return this._resultPerGender[billId];

        return null;
    },

    getVoteResultPerAgeByBillId: function(billId)
    {
        if (this._resultPerAge[billId] && this._resultPerAge[billId] !== true)
            return this._resultPerAge[billId];

        return null;
    },

    _showBillVoteResultHandler: function(billId)
    {
        this._fetchVoteResult(billId, this._result, '/api/vote/result/');
        this._fetchVoteResult(billId, this._resultPerGender, '/api/vote/result/per-gender/');
        this._fetchVoteResult(billId, this._resultPerAge, '/api/vote/result/per-age/');
        this._fetchVoteResult(billId, this._resultPerDate, '/api/vote/result/per-date/');
    },

    _fetchVoteResult: function(billId, collection, endpoint)
    {
        if (collection[billId])
        {
            if (collection[billId] !== true)
                this.trigger(this);

            return;
        }

        collection[billId] = true;

        jquery.get(
            endpoint + billId,
            (data) => {
                collection[billId] = data.result;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            collection[billId] = { error : xhr.status };
            this.trigger(this, collection[billId]);
        });
    }
});
