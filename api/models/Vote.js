var config = require('../config.json');

var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' }
});

Vote.add({
    app: { type: Types.Relationship, ref: 'App', required: true, initial: true, noedit: true },
	title: { type: String, required: true, noedit: true },
    url: { type: Types.Url, required: true, initial: true, noedit: true },
    description: { type: Types.Textarea, noedit: true },
    image: { type: Types.Url, initial: true, noedit: true },
    status: { type: Types.Select, options: ['open', 'complete', 'error'], default: 'open' },
    voteContractAddress: { type: String, noedit: true },
    voteContractABI: { type: String, noedit: true }
});

Vote.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'vote' });
Vote.relationship({ path: 'sources', ref: 'Source', refPath: 'vote' });

Vote.schema.methods.userIsAuthorizedToVote = function(user)
{
    return config.capabilities.vote.enabled
        && this.status == 'open'
        && !!user
        && (!user.iss || user.iss == this.app)
        && (!user.authorizedVotes
            || !user.authorizedVotes.length
            || user.authorizedVotes.indexOf(this.id) >= 0);
}


transform.toJSON(Vote);

Vote.defaultColumns = 'title, url, status, voteContractAddress';
Vote.register();
