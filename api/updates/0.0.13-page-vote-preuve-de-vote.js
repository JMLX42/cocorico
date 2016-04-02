var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'vote-preuve-de-vote'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-04-01T20:30:20.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/vote-preuve-de-vote.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-04-01T20:31:01.000Z",
					"showInNavBar": false,
					"slug": "vote-preuve-de-vote",
					"sortOrder": 13,
					"title": "Vote - Preuve de vote"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};