var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'attention-recuperer-preuve-de-vote-2'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-04-01T22:27:43.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/attention-recuperer-preuve-de-vote-2.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-04-01T22:27:53.000Z",
					"showInNavBar": false,
					"slug": "attention-recuperer-preuve-de-vote-2",
					"sortOrder": 11,
					"title": "Attention - Récupérer preuve de vote 2"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};