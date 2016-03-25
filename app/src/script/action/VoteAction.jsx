var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'vote': {sync: false},
    'unvote': {sync: false},
    'showBillVoteResult': {sync: false},
    'startPollingBallot': {sync: false},
    'stopPollingBallot': {sync: false}
});
