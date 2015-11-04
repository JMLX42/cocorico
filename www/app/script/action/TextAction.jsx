var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'list': {sync: false},
    'showLatest': {sync: false},
    'vote': {sync: false},
    'unvote': {sync: false},
    'show': {sync: false},
    'showCurrentUserVote': {sync: false},
    'listCurrentUserTexts': {sync: false},
    'save': {sync: false}
});
