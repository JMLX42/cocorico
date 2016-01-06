var Reflux = require('reflux');
var jquery = require('jquery');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.showTextVoteResult, this._showTextVoteResultHandler);

        this._texts = {};
    },

    getVoteResultByTextId: function(textId)
    {
        if (this._texts[textId] && this._texts[textId] !== true)
            return this._texts[textId];

        return null;
    },

    _showTextVoteResultHandler: function(textId)
    {
        if (this._texts[textId])
        {
            if (this._texts[textId] !== true)
                this.trigger(this);

            return;
        }

        this._texts[textId] = true;

        jquery.get(
            '/api/vote/result/' + textId,
            (data) => {
                this._texts[textId] = data.result;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._texts[textId] = { error : xhr.status };
            this.trigger(this, this._texts[textId]);
        });
    }
});
