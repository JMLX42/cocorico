var keystone = require('keystone');
var async = require('async');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.waterfall([
		function(callback) {
			Media.model.update(
				{slug: 'franceconnect-button'},
				{
					"file": {
						"filename": "franceconnect-button.png",
						"filetype": "image/png",
						"originalname": "franceconnect-button.png",
						"path": "public/upload",
						"size": 17657
					},
					"slug": "franceconnect-button",
					"title": "FranceConnect Button"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(callback) {
			Page.model.update(
				{slug: 'connexion'},
				{
					"contentType": "HTML",
					"createdAt": "2015-10-24T10:30:18.000Z",
					"html": "<p style=\"text-align: center;\"><a href=\"../../api/auth/login\" id=\"link-login\"> <img src=\"../../upload/franceconnect-button.png\" alt=\"\" /> </a></p>",
					"published": true,
					"publishedAt": "2015-10-24T10:32:31.000Z",
					"showInNavBar": false,
					"slug": "connexion",
					"sortOrder": 2,
					"title": "Connexion"
				},
				{upsert: true},
				function(err) { callback(err); }
			);
		},
		function(error, result) { done(); }
	]);
};
