var Reflux = require('reflux');

module.exports = Reflux.createActions({
  'show': {sync: false},
  'showPage': {sync: false},
  'showResults': {sync: false},
  'getPermissions': {sync: false},
  'getTransactions': {sync: false},
});
