var Reflux = require('reflux');
var EthereumAccounts = require('ethereumjs-accounts');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(BlockchainAccountAction.create, this._createAccount);

        this._userAccount = null;
    },

    getCurrentUserAccount: function()
    {
        return this._userAccount;
    },

    _createAccount: function(passphrase)
    {
        if (!this._userAccount)
        {
            var accounts = new EthereumAccounts({minPassphraseLength : 6});
            var accountObject = accounts.new(passphrase);

            this._userAccount = accountObject;

            this.trigger(this);
        }
    }
});
