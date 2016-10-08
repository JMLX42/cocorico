var Reflux = require('reflux');

module.exports = Reflux.createActions({
  'send': {sync: false},
  'cancel': {sync: false},
  'showCurrentUserBallot': {sync: false},
  'startPolling': {sync: false},
  'stopPolling': {sync: false},
  'getTransactions': {sync: false},
  'searchTransactions': {sync: false},
});
