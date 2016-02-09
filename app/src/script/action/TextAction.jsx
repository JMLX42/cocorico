var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'list': {sync: false},
    'showLatestTexts': {sync: false},
    'show': {sync: false},
    'showCurrentUserVote': {sync: false},
    'listCurrentUserTexts': {sync: false},
    'save': {sync: false},
    'delete': {sync: false},
    'changeStatus': {sync: false},
    'showSources': {sync: false},
    'addSource': {sync: false},
    'like': {sync: false},
    'likeBillPart': {sync: false}
});
