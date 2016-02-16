var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'politique-de-confidentialite'},
				{
					"contentType": "Markdown",
					"createdAt": "2015-10-25T22:54:41.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/politique-de-confidentialite.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2015-10-25T22:54:45.000Z",
					"showInNavBar": false,
					"slug": "politique-de-confidentialite",
					"sortOrder": 4,
					"title": "Politique De Confidentialité"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};