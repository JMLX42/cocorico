var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'astuce-etape-revision'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-01-04T19:41:38.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/astuce-etape-revision.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-01-04T19:41:47.000Z",
					"showInNavBar": false,
					"slug": "astuce-etape-revision",
					"sortOrder": 6,
					"title": "Astuce - Etape Révision"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};