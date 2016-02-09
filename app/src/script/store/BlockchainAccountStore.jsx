var Reflux = require('reflux');
var EthereumAccounts = require('ethereumjs-accounts');
var HookedWeb3Provider = require("hooked-web3-provider");
var Web3 = require('web3');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

module.exports = Reflux.createStore({
    listenables: [BlockchainAccountAction],

    init: function()
    {
        this.listenTo(BlockchainAccountAction.create, this._createAccount);

        this._userAccount = null;
        this._userProvider = null;

        this.trigger(this);
    },

    getInitialState: function()
    {
        return this;
    },

    getCurrentUserAccount: function()
    {
        return this._userAccount;
    },

    getCurrentUserProvider: function()
    {
        return this._userProvider;
    },

    _createAccount: function(passphrase)
    {
        if (!this._userAccount)
        {
            var web3 = new Web3();
            web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));
            
            var accounts = new EthereumAccounts({web3 : web3});

            this._userAccount = accounts.new(passphrase);
            console.log(this._userAccount);

            this._userProvider = new HookedWeb3Provider({
                host: "http://cocorico.cc.test/blockchain/",
                transaction_signer: accounts
            });

            this.trigger(this);
        }
    }
});
