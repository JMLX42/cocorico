var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'manifeste'},
				{
					"contentType": "Markdown",
					"createdAt": "2015-10-26T21:58:48.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/manifeste.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2015-10-26T21:59:03.000Z",
					"showInNavBar": true,
					"slug": "manifeste",
					"sortOrder": 0,
					"title": "Manifeste"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};