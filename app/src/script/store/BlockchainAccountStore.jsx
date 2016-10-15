var Reflux = require('reflux');
var lightwallet = require('eth-lightwallet');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

module.exports = Reflux.createStore({

  init: function() {
    this._deleteAllKeystores();

    this.listenTo(BlockchainAccountAction.create, this._createAccount);
    this.listenTo(BlockchainAccountAction.import, this._importSerializedAccount);
  },

  getInitialState: function() {
    return this;
  },

  getKeystoreByVoteId: function(voteId) {
    if (!(voteId in this._keystore)) {
      return null;
    }

    return this._keystore[voteId];
  },

  getPwDerivedKeyByVoteId: function(voteId) {
    if (!(voteId in this._pwDerivedKey)) {
      return null;
    }

    return this._pwDerivedKey[voteId];
  },

  getAddressByVoteId: function(voteId) {
    if (!(voteId in this._keystore)) {
      return null;
    }

    return this._keystore[voteId].getAddresses()[0];
  },

  getSerializedBlockchainAccountByVoteId: function(voteId) {
    if (!(voteId in this._keystore) || !this._keystore[voteId]) {
      return null;
    }

    return this._keystore[voteId].serialize();
  },

  _deleteKeystore: function(voteId) {
    delete this._keystore[voteId];
    delete this._pwDerivedKey[voteId];

    console.log('deleted keystore');
  },

  _deleteAllKeystores: function() {
    this._keystore = {};
    this._pwDerivedKey = {};
  },

  _createKeystore: function(voteId, callback) {
    var password = 'password'; // FIXME

    lightwallet.keystore.createVault(
      { password: password },
      (vaultErr, ks) => {
        if (vaultErr) {
          return callback(vaultErr, null, null);
        }

        return ks.keyFromPassword(password, (err, pwDerivedKey) => {
          ks.passwordProvider = (cb) => password;

          console.log('BlockchainAccountStore: created new keystore');
          return callback(err, ks, pwDerivedKey);
        });
      }
    );
  },

  _createAccount: function(voteId) {
        // // if (voteId in this._keystore)
        // //     return this.trigger(this);
        //
        // this._keystore[voteId] = false;

    this._createKeystore(voteId, (err, ks, pwDerivedKey) => {
      if (err) {
        console.error(err);
        return;
      }

      this._keystore[voteId] = ks;
      this._pwDerivedKey[voteId] = pwDerivedKey;

      ks.generateNewAddress(pwDerivedKey);

      var addresses = ks.getAddresses();
      var address = addresses[addresses.length - 1];

      console.log(
        'BlockchainAccountStore: generated new address ' + address
        + ' with private key ' + ks.exportPrivateKey(address, pwDerivedKey)
      );

      this.trigger(this);
    });
  },

  _importSerializedAccount: function(voteId, serializedAccount) {
    var ks = lightwallet.keystore.deserialize(serializedAccount);

    this._keystore[voteId] = ks

    console.log(
      'BlockchainAccountStore: imported serialized keystore '
      + this.getSerializedBlockchainAccountByVoteId(voteId)
    );

    var password = 'password'; // FIXME

    ks.keyFromPassword(password, (err, pwDerivedKey) => {
      this._pwDerivedKey[voteId] = pwDerivedKey;
      this.trigger(this);
    });
  },
});
