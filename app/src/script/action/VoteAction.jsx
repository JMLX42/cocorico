var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'generateProofOfVote': {sync: false},
    'vote': {sync: false},
    'unvote': {sync: false},
    'showBillVoteResult': {sync: false},
    'startPollingBallot': {sync: false},
    'stopPollingBallot': {sync: false}
});
