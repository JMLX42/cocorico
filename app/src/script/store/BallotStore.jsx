var Reflux = require('reflux');
var jquery = require('jquery');
var lightwallet = require('eth-lightwallet');
var Tx = require('ethereumjs-tx');
var async = require('async');

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

        this._deleteAllKeystores();
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

    _getKeystore: function(billId, callback)
    {
        if (!(billId in this._keystore))
        {
            var secretSeed = lightwallet.keystore.generateRandomSeed();
            var password = 'password'; // FIXME

            lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
                var ks = new lightwallet.keystore(secretSeed, pwDerivedKey);

                this._keystore[billId] = ks;
                this._pwDerivedKey[billId] = pwDerivedKey;
                ks.passwordProvider = (callback) => password;

                console.log('created new keystore');
                callback(ks, pwDerivedKey);
            });
        }
        else
            callback(this._keystore[billId], this._pwDerivedKey[billId]);
    },

    _deleteKeystore: function(billId)
    {
        delete this._keystore[billId];
        delete this._pwDerivedKey[billId];

        console.log('deleted keystore');
    },

    _deleteAllKeystores: function()
    {
        this._keystore = {};
        this._pwDerivedKey = {};
    },

    getSerializedKeystore: function(billId)
    {
        if (!(billId in this._keystore))
            return '';

        return this._keystore[billId].serialize();
    },

    getProofOfVote: function(billId)
    {
        if (!(billId in this._keystore))
            return null;

        var ks = this._keystore[billId];

        return {
            address: ks.getAddresses()[0]
        };
    },

    _generateAddress: function(billId, callback)
    {
        this._getKeystore(billId, (ks, pwDerivedKey) => {
            ks.generateNewAddress(pwDerivedKey);

            var addresses = ks.getAddresses();
            var address = '0x' + addresses[addresses.length - 1];

            console.log(
                'generated new address ' + address
                + ' with private key ' + ks.exportPrivateKey(address, pwDerivedKey)
            );

            callback(ks, pwDerivedKey, address);
        });
    },

    _getVoteTransaction: function(billId, voteContractAddress, voteContractABI, value, callback)
    {
        console.log('creating vote transaction');

        this._generateAddress(billId, (ks, pwDerivedKey, address) => {
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
                ks,
                pwDerivedKey,
                tx,
                address
            );

            console.log('signed tx', signedTx);

            callback(signedTx);
        });
    },

    _vote: function(bill, value)
    {
        // For now, we delete the existing keystore to make sure every vote will
        // create a new one.
        // FIXME: use the existing (scanned) keystore when the user will want to
        // change its vote using its "proof of vote".
        this._deleteKeystore(bill.id);

        this._getVoteTransaction(
            bill.id,
            bill.voteContractAddress,
            bill.voteContractABI,
            value,
            (tx) => {
                jquery.get(
                    '/api/vote/' + tx,
                    (data) => {
                        console.log('vote transaction sent');
                        this._ballots[bill.id] = data.ballot;
                        this.trigger(this);
                    }
                );
            }
        );
    },

    _removeVote: function(billId, callback)
    {
        jquery.get(
            '/api/vote/remove/' + billId,
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

    _unvote: function(billId)
    {
        this._removeVote(billId, (data) => this.trigger(this));
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
