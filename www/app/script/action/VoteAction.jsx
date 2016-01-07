var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'vote': {sync: false},
    'unvote': {sync: false},
    'showTextVoteResult': {sync: false}
});
