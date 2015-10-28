var keystone = require('keystone');
var async = require('async');

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
					"html": "<div class=\"section\">\r\n<h1 style=\"text-align: center;\">Aux urnes, citoyens !</h1>\r\n<p style=\"text-align: center;\">Cocorico est une plateforme de d&eacute;mocratie participative o&ugrave; les citoyens peuvent voter et proposer des r&eacute;f&eacute;rendums de fa&ccedil;on 100% anonyme et s&eacute;curis&eacute;e.</p>\r\n</div>",
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