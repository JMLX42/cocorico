var Reflux = require('reflux');
var jquery = require('jquery');
var lightwallet = require('eth-lightwallet');
var Tx = require('ethereumjs-tx');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.vote, this._vote);
        this.listenTo(VoteAction.unvote, this._unvote);
        this.listenTo(BillAction.showCurrentUserVote, this._fetchBallotByBillId);

        this._ballots = {};
    },

    getBallotAccount: function(ballot)
    {
        if (!ballot.address || !this._accounts.contains(ballot.address))
            return null;

        return this._accounts.get(ballot.address);
    },

    getBallotByBillId: function(billId)
    {
        if (this._ballots[billId])
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
                this._signBallotAndTrigger(data.ballot);
            }
        ).error((xhr, billStatus, err) => {
            this._ballots[billId] = { error: xhr.status };
            this.trigger(this, this._ballots[billId]);
        });

        return true;
    },

    _getKeystore: function(callback)
    {
        if (!this._keystore)
        {
            var secretSeed = lightwallet.keystore.generateRandomSeed();
            var password = 'password'; // FIXME

            lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
                var ks = new lightwallet.keystore(secretSeed, pwDerivedKey);

                this._keystore = ks;
                this._pwDerivedKey = pwDerivedKey;
                ks.passwordProvider = (callback) => 'password';

                callback(ks, pwDerivedKey);
            });
        }
        else
            callback(this._keystore, this._pwDerivedKey);
    },

    _deleteKeystore: function()
    {
        delete this._keystore;
        delete this._pwDerivedKey;
    },

    _generateAddress: function(callback)
    {
        this._getKeystore((ks, pwDerivedKey) => {
            ks.generateNewAddress(pwDerivedKey);

            var addresses = ks.getAddresses();

            callback('0x' + addresses[addresses.length - 1]);
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
        if (ballot.status != 'signing' || !ballot.transactionParameters)
            return this._removeVote(ballot.bill, (data) => error());

        this._getKeystore((ks, pwDerivedKey) => {
            // If the ballot address is not available client side, then we can
            // assume the ballot did not originate from this client so we remove it.
            if (ks.getAddresses().indexOf(ballot.address.substring(2)) > 0)
                return this._removeVote(ballot.bill, (data) => error());

            // Otherwise, we sign the transaction and send the serialized signed
            // raw transaction back to the server.
            var tx = new Tx(JSON.parse(ballot.transactionParameters));
            var signedTx = '0x' + lightwallet.signing.signTx(
                ks,
                pwDerivedKey,
                tx.serialize(),
                ballot.address
            );

            jquery.get(
                '/api/vote/transaction/' + ballot.bill + '/' + ballot.address
                    + '/' + signedTx,
                (data) => {
                    // When the ballot/transaction is signed, we remove the
                    // corresponding account from the client storage.
                    // Otherwise, someone else on the same computer/client
                    // could get this account and change this vote.
                    // FIXME: we should first provide a printable "proof of
                    // vote" by serializing the account into a QR code.
                    this._deleteKeystore();
                    success(data);
                }
            );
        });
    },

    _vote: function(billId, value)
    {
        this._generateAddress((address) => {
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
        jquery.get(
            '/api/vote/remove/' + billId,
            (data) => {
                delete this._ballots[billId];
                callback(data);
            }
        );
    },

    _unvote: function(billId)
    {
        this._removeVote(billId, (data) => this.trigger(this));
    }
});
