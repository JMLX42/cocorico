var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'astuce-etape-debat'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-01-03T22:46:46.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/astuce-etape-debat.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-01-03T22:46:49.000Z",
					"showInNavBar": false,
					"slug": "astuce-etape-debat",
					"sortOrder": 5,
					"title": "Astuce - Etape Débat"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};