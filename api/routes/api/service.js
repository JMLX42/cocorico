var config = require('../../config.json');

var keystone = require('keystone');
var Web3 = require('web3');

function getBlockchainStatus() {
  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

  return web3.isConnected();
}

function getBlockchainMinerStatus() {
  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

  return web3.isConnected() && web3.eth.mining;
}

function getQueueStatus(callback) {
  require('amqplib/callback_api').connect(
    'amqp://localhost',
    (err, conn) => {
      if (err != null)
        return callback(false);

      return callback(true);
    }
  );
}

function getDatabaseStatus() {
  return keystone.mongoose.connection.readyState !== 0;
}

exports.getStatus = function(req, res) {
  getQueueStatus((queueIsConnected) => {
    var blockchainMinerIsConnected = getBlockchainMinerStatus();
    var databaseIsConnected = getDatabaseStatus();

    return res.apiResponse({
      system : {
        blockchainNode : getBlockchainStatus(),
        blockchainMiner : blockchainMinerIsConnected,
        blockchainVote : config.capabilities.bill.vote === 'blockchain',
        database : databaseIsConnected,
        queue : queueIsConnected,
      },
      capabilities : {
        vote : config.blockchain.voteEnabled
          ? queueIsConnected && blockchainMinerIsConnected
          : databaseIsConnected,
        createBill : config.capabilities.bill.create
          && (config.capabilities.bill.vote === 'blockchain'
            ? blockchainMinerIsConnected
            : databaseIsConnected),
        readBill : config.capabilities.bill.read && databaseIsConnected,
      },
    });
  });
}
