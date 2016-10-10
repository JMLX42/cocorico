var config = require('/opt/cocorico/api-web/config.json');

var childProcess = require('child_process');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // 20 second timeout

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

function exitHandler(err) {
  if (err) {
    console.log(err.stack);
  }

  restoreDatabase();
  process.exit();
}

beforeAll(dumpDatabase);
afterAll(restoreDatabase);

//catches ctrl+c event
process.on('SIGINT', exitHandler);
//catches uncaught exceptions
process.on('uncaughtException', exitHandler);
