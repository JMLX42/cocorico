var Reflux = require('reflux');
var jquery = require('jquery');
var EthereumAccounts = require('ethereumjs-accounts');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(VoteAction.vote, this._vote);
        this.listenTo(VoteAction.unvote, this._unvote);
        this.listenTo(BillAction.showCurrentUserVote, this._fetchBallotByBillId);

        this._ballots = {};

        this._accounts = new EthereumAccounts({ web3 : null});
        this._accounts.clear();
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
                this._ballots[billId] = data.ballot;
                this.trigger(this);
            }
        ).error((xhr, billStatus, err) => {
            this._ballots[billId] = { error: xhr.status };
            this.trigger(this, this._ballots[billId]);
        });

        return true;
    },

    _signBallot: function(ballot, success, error)
    {
        // If the ballot address is not available client side, then we can
        // assume the ballot did not originate from this client so we remove it.
        if (!this._accounts.contains(ballot.address))
            return this._removeVote(ballot.bill, (data) => error());

        // Otherwise, we sign the transaction and send the serialized signed
        // raw transaction back to the server.
        this._accounts.signTransaction(
            JSON.parse(ballot.transactionParameters),
            (err, serializedTx) => {
                jquery.get(
                    '/api/vote/transaction/' + ballot.bill + '/' + ballot.address
                        + '/' + serializedTx,
                    (data) => {
                        // When the ballot/transaction is signed, we remove the
                        // corresponding account from the client storage.
                        // Otherwise, someone else on the same computer/client
                        // could get this account and change this vote.
                        // FIXME: we should first provide a printable "proof of
                        // vote" by serializing the account into a QR code.
                        this._accounts.remove(ballot.address);
                        success(data);
                    }
                );
            });
    },

    _vote: function(billId, value)
    {
        // FIXME: we should ask the user for a passphrase
        var ballotAccount = this._accounts.new(null);

        jquery.get(
            '/api/vote/' + value + '/' + billId + '/' + ballotAccount.address,
            (data) => {
                // Ballot should be ready to be signed, so we must sign it before
                // doing anything else.
                if (data.ballot.transactionParameters)
                {
                    this._signBallot(
                        data.ballot,
                        (data) => {
                            this._ballots[billId] = data.ballot;
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
                    this._ballots[billId] = data.ballot;
                    this.trigger(this);
                }
            }
        );
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
