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
        this.listenTo(VoteAction.vote, this._vote);
        this.listenTo(VoteAction.unvote, this._unvote);
        this.listenTo(VoteAction.startPollingBallot, this._startPollingBallot);
        this.listenTo(VoteAction.stopPollingBallot, this._stopPollingBallot);
        this.listenTo(BillAction.showCurrentUserVote, this._fetchBallotByBillId);

        this._ballots = {};
        this._ballotPolling = {};

        this._deleteAllKeystores();
    },

    getBallotByBillId: function(billId)
    {
        if (this._ballots[billId] && this._ballots[billId] !== true)
            return this._ballots[billId];

        return null;
    },

    _fetchBallotByBillId: function(billId, noCache)
    {
        if (this._ballots[billId] && !noCache)
        {
            this.trigger(this);
            return false;
        }

        this._ballots[billId] = true;

        jquery.get(
            '/api/bill/ballot/' + billId,
            (data) => {
                // If the user closed its client before we had a chance to reply
                // to the ballot creation with a ballot signing request, we have
                // left the ballot hanging with a "signing" status. We have to
                // fix this by signing it as soon as we fetch it.
                // this._signBallotAndTrigger(data.ballot);

                this._ballots[billId] = data.ballot;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._ballots[billId] = { error: xhr.status };
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

            callback(address);
        });
    },

    _signBallotAndTrigger: function(ballot)
    {
        if (ballot.status == 'signing')
        {
            this._signBallot(
                ballot,
                (data) => {
                    this._ballots[ballot.bill] = ballot;
                    this.trigger(this);
                },
                () => {
                    // Ballot has been removed.
                    this.trigger(this);
                }
            )
        }
        else
        {
            this._ballots[ballot.bill] = ballot;
            this.trigger(this);
        }
    },

    _signBallot: function(ballot, success, error)
    {
        if (ballot.error || ballot.status != 'signing' || !ballot.transactionParameters)
        {
            console.error('invalid ballot');
            return this._removeVote(ballot.bill, (data) => error());
        }

        console.log('signing ballot with address ' + ballot.address);

        this._getKeystore(ballot.bill, (ks, pwDerivedKey) => {
            // If the ballot address is not available client side, then we can
            // assume the ballot did not originate from this client so we remove it.
            if (ks.getAddresses().indexOf(ballot.address.substring(2)) < 0)
            {
                console.error('unknown ballot address ' + ballot.address);
                return this._removeVote(ballot.bill, (data) => error());
            }

            // Otherwise, we sign the transaction and send the serialized signed
            // raw transaction back to the server.
            var tx = new Tx(JSON.parse(ballot.transactionParameters));
            var signedTx = '0x' + lightwallet.signing.signTx(
                ks,
                pwDerivedKey,
                tx.serialize(),
                ballot.address
            );

            var polling = this._isPollingBallot(ballot.bill);
            // Ballots fetched by polling might be signed as part of the
            // fetching process. But signing the same ballot twice will trigger
            // a legit error in the API. So we pause polling before sending the
            // signing request and then we resum it when we're done.
            this._stopPollingBallot(ballot.bill);

            jquery.get(
                '/api/vote/transaction/' + ballot.bill + '/' + ballot.address
                    + '/' + signedTx,
                (data) => {
                    console.log('signed ballot with address ' + data.ballot.address);
                    if (polling)
                        this._startPollingBallot(ballot.bill);
                    success(data);
                }
            );
        });
    },

    _vote: function(billId, value)
    {
        // For now, we delete the existing keystore to make sure every vote will
        // create a new one.
        // FIXME: use the existing (scanned) keystore when the user will want to
        // change its vote using its "proof of vote".
        this._deleteKeystore(billId);

        this._generateAddress(billId, (address) => {
            jquery.get(
                '/api/vote/' + value + '/' + billId + '/' + address,
                (data) => {
                    // Ballot should be ready to be signed, so we must sign it before
                    // doing anything else.
                    this._signBallotAndTrigger(data.ballot);
                }
            );
        });
    },

    _removeVote: function(billId, callback)
    {
        delete this._ballots[billId];
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
