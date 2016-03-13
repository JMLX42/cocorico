var Reflux = require('reflux');

module.exports = Reflux.createActions({
    'list': {sync: false},
    'showLatestBills': {sync: false},
    'show': {sync: false},
    'showBySlug': {sync: false},
    'showCurrentUserVote': {sync: false},
    'listCurrentUserBills': {sync: false},
    'save': {sync: false},
    'delete': {sync: false},
    'changeStatus': {sync: false},
    'showSources': {sync: false},
    'addSource': {sync: false},
    'like': {sync: false},
    'likeBillPart': {sync: false}
});
