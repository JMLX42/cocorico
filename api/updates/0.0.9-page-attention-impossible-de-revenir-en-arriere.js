var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'attention-impossible-de-revenir-en-arriere'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-04-01T18:25:35.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/attention-impossible-de-revenir-en-arriere.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-04-01T18:25:37.000Z",
					"showInNavBar": false,
					"slug": "attention-impossible-de-revenir-en-arriere",
					"sortOrder": 9,
					"title": "Attention Impossible de revenir en arriere"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};