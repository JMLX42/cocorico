var config = require('../config.json');

var keystone = require('keystone');
var transform = require('model-transform');
var metafetch = require('metafetch');
var async = require('async');

var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
    autokey: { path: 'slug', from: 'title', unique: true },
    // map: { name: 'title' },
    track: { createdAt: true, updatedAt: true },
    sortable: true,
    noedit: config.env != 'development',
    nocreate: config.env != 'development',
    nodelete: config.env != 'development'
});

Vote.add({
    app: { type: Types.Relationship, ref: 'App', initial: true },
    url: { type: Types.Url, initial: true },
	title: { type: Types.Text, noedit: true },
    description: { type: Types.Textarea, noedit: true },
    image: { type: Types.Url, noedit: true },
    status: {
        type: Types.Select,
        options: ['initializing', 'open', 'complete', 'error'],
        noedit: true
    },
    voteContractAddress: { type: Types.Text, noedit: true },
    voteContractABI: { type: Types.Text, noedit: true },
    restricted: { type: Types.Boolean, default: false },
    labels: { type: Types.TextArray, noedit: true }
});

Vote.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'vote' });
Vote.relationship({ path: 'sources', ref: 'Source', refPath: 'vote' });

Vote.schema.methods.userIsAuthorizedToVote = function(user) {
    return config.capabilities.vote.enabled
        && this.status == 'open'
        && !!user
        && (!this.restricted || (!!user.iss && user.iss == this.app))
        && (!user.authorizedVotes
            || !user.authorizedVotes.length
            || user.authorizedVotes.indexOf(this.id) >= 0);
}

function pushVoteOnQueue(vote, callback) {
	require('amqplib/callback_api').connect(
		'amqp://localhost',
		(err, conn) => {
			if (err != null)
				return callback(err, null);

			conn.createChannel(function(err, ch)
			{
				if (err != null)
					return callback(err, null);

				var voteMsg = { vote : { id : vote.id } };

				ch.assertQueue('votes');
				ch.sendToQueue(
					'votes',
					new Buffer(JSON.stringify(voteMsg)),
					{ persistent : true }
				);

				callback(null, voteMsg);
			});
		}
	);
}

Vote.schema.pre('validate', function(next) {
    var self = this;

    if (!self.url) {
        return next();
    }

    async.waterfall(
        [
            (callback) => !metafetch.fetch(
                self.url,
                {
                    flags: { images: false, links: false },
                    http: { timeout: 30000 }
                },
                (err, meta) => {
                    self.title = meta.title;
                    self.description = meta.description;
                    self.image = meta.image;

                    callback(null);
                }
            ),
            (callback) => {
                if (!self.status) {
                    self.status = 'initializing';
                    pushVoteOnQueue(self, (err, msg) => callback(err));
                } else {
                    callback(null);
                }
            }
        ],
        (err) => {
            next(err);
        }
    );
});

transform.toJSON(Vote);

Vote.defaultColumns = 'title, url, status, voteContractAddress';
Vote.register();
