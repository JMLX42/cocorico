var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'astuce-etape-vote'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-03-05T15:10:02.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/astuce-etape-vote.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-03-05T15:10:09.000Z",
					"showInNavBar": false,
					"slug": "astuce-etape-vote",
					"sortOrder": 7,
					"title": "Astuce - Etape Vote"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};