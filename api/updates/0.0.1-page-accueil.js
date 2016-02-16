var keystone = require('keystone');
var async = require('async');

var fs = require('fs');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Page.model.update(
				{slug: 'accueil'},
				{
					"contentType": "HTML",
					"createdAt": "2015-10-25T20:37:31.000Z",
					"html": fs.readFileSync('./updates/pages/accueil.html', 'utf8'),
					"published": true,
					"publishedAt": "2015-10-25T20:37:34.000Z",
					"showInNavBar": false,
					"slug": "accueil",
					"sortOrder": 3,
					"title": "Accueil"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};