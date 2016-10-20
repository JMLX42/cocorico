import lightwallet from 'eth-lightwallet';

function getTransaction(keystore,
                        pwDerivedKey,
                        address,
                        voteContractAddress,
                        voteContractABI,
                        value) {
  var tx = lightwallet.txutils.functionTx(
    JSON.parse(voteContractABI),
    'vote',
    [value],
    {
      to: voteContractAddress,
      gasLimit: 999999,
      gasPrice: 20000000000,
      nonce: 0,
    }
  );

  return '0x' + lightwallet.signing.signTx(
    keystore,
    pwDerivedKey,
    tx,
    address
  );
}

function createKeystore(callback) {
  var password = 'password'; // FIXME

  lightwallet.keystore.createVault(
    { password: password },
    (vaultErr, ks) => {
      if (vaultErr) {
        return callback(vaultErr, null, null);
      }

      return ks.keyFromPassword(password, (err, pwDerivedKey) => {
        ks.passwordProvider = (cb) => password;

        return callback(err, ks, pwDerivedKey);
      });
    }
  );
}

export default async function(vote, value) {
  return new Promise((resolve, reject) => {
    createKeystore((err, ks, pwDerivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      ks.generateNewAddress(pwDerivedKey);

      var addresses = ks.getAddresses();
      var address = addresses[addresses.length - 1];

      resolve(getTransaction(
        ks,
        pwDerivedKey,
        address,
        vote.voteContractAddress,
        vote.voteContractABI,
        value
      ));
    });
  });
}
