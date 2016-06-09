var Reflux = require('reflux');
var jquery = require('jquery');
var lightwallet = require('eth-lightwallet');
var Tx = require('ethereumjs-tx');
var async = require('async');
var bcrypt = require('bcryptjs');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        jquery.ajaxSetup({ cache: false });

        this.listenTo(VoteAction.vote, this._vote);
        this.listenTo(VoteAction.unvote, this._unvote);
        this.listenTo(VoteAction.startPollingBallot, this._startPollingBallot);
        this.listenTo(VoteAction.stopPollingBallot, this._stopPollingBallot);
        this.listenTo(BillAction.showCurrentUserVote, this._fetchBallotByBillId);

        this._ballots = {};
        this._loadingBallot = {};
        this._ballotPolling = {};
    },

    getInitialState: function()
    {
        return this;
    },

    getBallotByBillId: function(billId)
    {
        return this._ballots[billId];
    },

    _fetchBallotByBillId: function(billId, forceUpdate)
    {
        if (billId in this._loadingBallot)
            return false;

        if (this._ballots[billId] && !forceUpdate)
        {
            this.trigger(this);
            return false;
        }

        this._loadingBallot[billId] = true;

        jquery.get(
            '/api/bill/ballot/' + billId,
            (data) => {
                this._ballots[billId] = data.ballot;
                delete this._loadingBallot[billId];

                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._ballots[billId] = { error: xhr.status };
            delete this._loadingBallot[billId];

            this.trigger(this, this._ballots[billId]);
        });

        return true;
    },

    _getVoteTransaction: function(keystore,
                                  pwDerivedKey,
                                  address,
                                  billId,
                                  voteContractAddress,
                                  voteContractABI,
                                  value)
    {
        console.log('creating vote transaction');

        var tx = lightwallet.txutils.functionTx(
            JSON.parse(voteContractABI),
            'vote',
            value,
            {
                to: voteContractAddress,
                gasLimit: 999999,
                gasPrice: 20000000000,
                value: 0,
                nonce: 0
            }
        );

        var signedTx = '0x' + lightwallet.signing.signTx(
            keystore,
            pwDerivedKey,
            tx,
            address
        );

        console.log('signed tx', signedTx);

        return signedTx;
    },

    _vote: function(keystore, pwDerivedKey, address, bill, value)
    {
        var tx = this._getVoteTransaction(
            keystore,
            pwDerivedKey,
            address,
            bill.id,
            bill.voteContractAddress,
            bill.voteContractABI,
            value
        );

        jquery.post(
            '/api/vote/',
            {
                transaction: tx,
                // voterCardHash: bcrypt.hashSync(keystore.serialize(), 10),
            },
            (data) => {
                console.log('vote transaction sent');
                this._ballots[bill.id] = data.ballot;
                this.trigger(this);
            }
        );
    },

    _removeVote: function(keystore, billId, callback)
    {
        jquery.post(
            '/api/vote/remove/' + billId,
            {
                // voterCardHash: keystore
                //     ? bcrypt.hashSync(keystore.serialize(), 10)
                //     : null,
                transaction: null // FIXME: generate the actual blockchain transaction
            },
            (data) => {
                // No ballot object => ballot is loading. To make sure the
                // removed ballot does not make the app hang waiting for a
                // ballot object, we create a dummy ballot object with an error
                // state.
                this._ballots[billId] = {error:'removed'};

                if (callback)
                    callback(data);
            }
        );
    },

    _unvote: function(keystore, billId)
    {
        this._removeVote(keystore, billId, (data) => this.trigger(this));
    },

    _startPollingBallot: function(billId)
    {
        if (this._isPollingBallot(billId))
            return;

        this._ballotPolling[billId] = true;

        console.log('start polling ballot for bill ' + billId);

        async.whilst(
            () => {
                return this._isPollingBallot(billId);
            },
            (callback) => {
                this._fetchBallotByBillId(billId, true);
                this._ballotPolling[billId] = setTimeout(callback, 10000);
            },
            (err) => {
                this._stopPollingBallot(billId);
            }
        );
    },

    _isPollingBallot: function(billId)
    {
        return billId in this._ballotPolling;
    },

    _stopPollingBallot: function(billId)
    {
        if (this._isPollingBallot(billId))
        {
            console.log('stop polling ballot for bill ' + billId);

            if (this._ballotPolling[billId] !== true)
                clearTimeout(this._ballotPolling[billId]);

            delete this._ballotPolling[billId];
        }
    }
});
