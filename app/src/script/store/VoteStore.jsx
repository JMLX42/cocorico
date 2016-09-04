var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.showResults, this._fetchVoteResults);
        this.listenTo(VoteAction.show, this._fetch);
        this.listenTo(VoteAction.showPage, this._fetchBySlug);

        this._loading = {};
        this._votes = [];
        this._result = {};
        this._resultPerGender = {};
        this._resultPerAge = {};
        this._resultPerDate = {};
    },

    getInitialState: function() {
        return this;
    },

    getById: function(voteId) {
        return this._getByPropertyValue('id', voteId);
    },

    getBySlug: function(voteSlug) {
        return this._getByPropertyValue('slug', voteSlug);
    },

    _getByPropertyValue: function(name, value) {
        for (var vote of this._votes) {
            if (vote[name] == value) {
                return vote;
            }
        }

        return null;
    },

    getVoteResultByVoteId: function(voteId) {
        if (this._result[voteId] && this._result[voteId] !== true)
            return this._result[voteId];

        return null;
    },

    getVoteResultPerDateByVoteId: function(voteId) {
        if (this._resultPerDate[voteId] && this._resultPerDate[voteId] !== true)
            return this._resultPerDate[voteId];

        return null;
    },

    getVoteResultPerGenderByVoteId: function(voteId) {
        if (this._resultPerGender[voteId] && this._resultPerGender[voteId] !== true)
            return this._resultPerGender[voteId];

        return null;
    },

    getVoteResultPerAgeByVoteId: function(voteId) {
        if (this._resultPerAge[voteId] && this._resultPerAge[voteId] !== true)
            return this._resultPerAge[voteId];

        return null;
    },

    _fetchVoteResults: function(voteId) {
        this._fetchVoteResult(voteId, this._result, '/api/vote/result/');
        // this._fetchVoteResult(voteId, this._resultPerGender, '/api/vote/result/per-gender/');
        // this._fetchVoteResult(voteId, this._resultPerAge, '/api/vote/result/per-age/');
        // this._fetchVoteResult(voteId, this._resultPerDate, '/api/vote/result/per-date/');
    },

    _fetchVoteResult: function(voteId, collection, endpoint) {
        if (collection[voteId])
        {
            if (collection[voteId] !== true)
                this.trigger(this);

            return;
        }

        collection[voteId] = true;

        jquery.get(
            endpoint + voteId,
            (data) => {
                collection[voteId] = data.result;
                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            collection[voteId] = { error : xhr.status };
            this.trigger(this, collection[voteId]);
        });
    },

    _fetch: function(voteId) {
        if (voteId in this._loading)
            return;

        this._loading[voteId] = true;

        jquery.get(
            '/api/vote/' + voteId,
            (data) => {
                delete this._loading[voteId];
                this._votes.push(data.vote);
                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this._votes.push({ error : xhr.status });
            this.trigger(this);
        });
    },

    _fetchBySlug: function(voteSlug) {
        if (voteSlug in this._loading)
            return;

        this._loading[voteSlug] = true;

        jquery.get(
            '/api/vote/by-slug/' + voteSlug,
            (data) => {
                delete this._loading[voteSlug];
                this._votes.push(data.vote);
                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this._votes.push({ error : xhr.status });
            this.trigger(this);
        });
    }
});
