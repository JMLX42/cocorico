var Reflux = require('reflux');
var qr = require('qr-image');

var VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.generateProofOfVote, this._generateProofOfVote);

        this._pov = {};
    },

    getInitialState: function() {
        return this;
    },

    getProofOfVoteByBillId: function(billId) {
        return this._pov[billId];
    },

    _generateProofOfVote: function(billId) {
        if (billId in this._pov)
            return;

        var pof = '0x42424242';
        var svg = qr.imageSync(
            pof,
            { type: 'svg', ec_level: 'M' }
        );

        svg = svg.replace('</svg>', '<desc>' + pof + '</desc></svg>');

        this._pov[billId] = svg;

        this.trigger(this);
    }
});
