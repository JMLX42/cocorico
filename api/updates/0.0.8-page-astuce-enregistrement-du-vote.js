var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'astuce-enregistrement-du-vote'},
				{
					"contentType": "Markdown",
					"createdAt": "2016-03-26T14:22:36.000Z",
					"markdown": {
						"md": fs.readFileSync('./updates/pages/astuce-enregistrement-du-vote.md', 'utf8')
					},
					"published": true,
					"publishedAt": "2016-03-26T14:22:40.000Z",
					"showInNavBar": false,
					"slug": "astuce-enregistrement-du-vote",
					"sortOrder": 8,
					"title": "Astuce - Enregistrement Du Vote"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};