var keystone = require('keystone');
var async = require('async');

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
						"html": "<h3 id=\"ce-texte-est-en-cours-de-d-bat\">Ce texte est en cours de débat</h3>\n<p>Le texte ci-dessus a été élaboré grâce aux contributions de la communauté. Vous pouvez maintenant contribuer au débat contradictoire en proposant des arguments pour ou contre ce texte. Ces arguments doivent permettre aux futurs voteurs de se forger une opinion sur ce texte.</p>\n",
						"md": "### Ce texte est en cours de débat\r\n\r\nLe texte ci-dessus a été élaboré grâce aux contributions de la communauté. Vous pouvez maintenant contribuer au débat contradictoire en proposant des arguments pour ou contre ce texte. Ces arguments doivent permettre aux futurs voteurs de se forger une opinion sur ce texte."
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