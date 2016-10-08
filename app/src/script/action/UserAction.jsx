var Reflux = require('reflux');

module.exports = Reflux.createActions({
  'requireLogin': {sync: false},
  'listAuthProviders': {sync: false},
});
