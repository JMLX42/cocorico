var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'aide'},
				{
					"contentType": "Markdown",
					"createdAt": "2015-10-25T22:19:29.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/aide.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2015-10-25T22:19:32.000Z",
					"showInNavBar": true,
					"slug": "aide",
					"sortOrder": 1,
					"title": "Aide"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};