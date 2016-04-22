var Reflux = require('reflux');
var lightwallet = require('eth-lightwallet');
var Tx = require('ethereumjs-tx');
var qr = require('qr-image');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

module.exports = Reflux.createStore({

    init: function() {
        this._deleteAllKeystores();

        this._voterCard = {};

        this.listenTo(BlockchainAccountAction.create, this._createAccount);
        this.listenTo(BlockchainAccountAction.import, this._importSerializedAccount);
    },

    getInitialState: function() {
        return this;
    },

    getKeystoreByBillId: function(billId) {
        if (!(billId in this._keystore)) {
            return null;
        }

        return this._keystore[billId];
    },

    getPwDerivedKeyByBillId: function(billId) {
        if (!(billId in this._pwDerivedKey)) {
            return null;
        }

        return this._pwDerivedKey[billId];
    },

    getVoterCardByBillId: function(billId) {
        if (!(billId in this._voterCard)) {
            return null;
        }

        return this._voterCard[billId];
    },

    getAddressByBillId: function(billId) {
        if (!(billId in this._keystore)) {
            return null;
        }

        return this._keystore[billId].getAddresses()[0];
    },

    getSerializedBlockchainAccountByBillId: function(billId) {
        if (!(billId in this._keystore) || !this._keystore[billId]) {
            return null;
        }

        return this._keystore[billId].serialize();
    },

    _deleteKeystore: function(billId) {
        delete this._keystore[billId];
        delete this._pwDerivedKey[billId];

        console.log('deleted keystore');
    },

    _deleteAllKeystores: function() {
        this._keystore = {};
        this._pwDerivedKey = {};
    },

    _getKeystore: function(billId, callback) {
        var secretSeed = lightwallet.keystore.generateRandomSeed();
        var password = 'password'; // FIXME

        lightwallet.keystore.deriveKeyFromPassword(password, (err, pwDerivedKey) => {
            var ks = new lightwallet.keystore(secretSeed, pwDerivedKey);

            ks.passwordProvider = (callback) => password;

            console.log('BlockchainAccountStore: created new keystore');
            callback(ks, pwDerivedKey);
        });
    },

    _generateVoterCard: function(ks) {
        var voterCardData = ks.serialize();
        var svg = qr.imageSync(
            voterCardData,
            { type: 'svg', ec_level: 'M' }
        );

        return svg.replace('</svg>', '<desc>' + voterCardData + '</desc></svg>');
    },

    _createAccount: function(billId) {
        // // if (billId in this._keystore)
        // //     return this.trigger(this);
        //
        // this._keystore[billId] = false;

        this._getKeystore(billId, (ks, pwDerivedKey) => {
            this._keystore[billId] = ks;
            this._pwDerivedKey[billId] = pwDerivedKey;

            ks.generateNewAddress(pwDerivedKey);

            var addresses = ks.getAddresses();
            var address = '0x' + addresses[addresses.length - 1];

            console.log(
                'BlockchainAccountStore: generated new address ' + address
                + ' with private key ' + ks.exportPrivateKey(address, pwDerivedKey)
            );

            this._voterCard[billId] = this._generateVoterCard(ks);

            this.trigger(this);
        });
    },

    _importSerializedAccount: function(billId, serializedAccount) {
        this._keystore[billId] = lightwallet.keystore.deserialize(
            serializedAccount
        );

        console.log(
            'BlockchainAccountStore: imported serialized keystore '
            + this.getSerializedBlockchainAccountByBillId(billId)
        );

        this.trigger(this);
    }

});
