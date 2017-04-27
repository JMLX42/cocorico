var config = require('/opt/cocorico/api-web/config.json');

var childProcess = require('child_process');
var amqplib = require('amqplib');
var delay = require('timeout-as-promise');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000; // 30 second timeout

if (config.env === 'development') {
  // Allow self-signed SSL certificates.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Naive window.crypto polyfill. Required by eth-lightwallet.
window.crypto = {
  getRandomValues: function(array) {
    var v = require('crypto').randomBytes(array.length);
    for (var i = 0; i < array.length; i++) {
      array[i] = v[i];
    }
  },
};

console.warn = () => null;

function dumpDatabase() {
  childProcess.execSync(
    'LC_ALL="en_US.UTF-8" mongodump --out /tmp/cocorico/dump',
    {stdio:'ignore'}
  );
}

function restoreDatabase() {
  childProcess.execSync(
    'LC_ALL="en_US.UTF-8" mongorestore --drop /tmp/cocorico/dump',
    {stdio:'ignore'}
  );
}

async function emptyQueues() {
  var conn = await amqplib.connect(null, {heartbeat:30});
  var ch = await conn.createChannel();
  await ch.purgeQueue('votes');
  await ch.purgeQueue('ballots');
  ch.close();
  conn.close();
}

function exitHandler(err) {
  if (err) {
    console.log(err.stack);
  }

  restoreDatabase();
  emptyQueues();
  process.exit();
}

beforeAll(() => {
  dumpDatabase();
  emptyQueues();
});
afterAll(() => {
  restoreDatabase();
  emptyQueues();
});

//catches ctrl+c event
process.on('SIGINT', exitHandler);
//catches uncaught exceptions
process.on('uncaughtException', exitHandler);
