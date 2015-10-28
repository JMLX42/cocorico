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
					"html": "<div class=\"section\">\r\n<h1 style=\"text-align: center;\">Aux urnes, citoyens !</h1>\r\n<p style=\"text-align: center;\">Cocorico est une plateforme de d&eacute;mocratie participative o&ugrave; les citoyens peuvent voter et proposer des r&eacute;f&eacute;rendums de fa&ccedil;on 100% anonyme et s&eacute;curis&eacute;e.</p>\r\n</div>\r\n<div class=\"section\">\r\n<div class=\"container\">\r\n<div class=\"row\">\r\n<div class=\"col-md-4 text-center\">\r\n<h2>Je propose</h2>\r\n<p>de nouveaux textes et de nouveaux projets &agrave; la communaut&eacute; pour qu'elle y contribue.</p>\r\n</div>\r\n<div class=\"col-md-4 text-center\">\r\n<h2>Je contribue</h2>\r\n<p>en amendant les textes propos&eacute;s par la communaut&eacute; et en validant les amendements des autres.</p>\r\n</div>\r\n<div class=\"col-md-4 text-center\">\r\n<h2>Je vote</h2>\r\n<p>pour faire entendre ma voix et soutenir les projets qui me concernent.</p>\r\n</div>\r\n</div>\r\n</div>\r\n</div>",
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