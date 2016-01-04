var keystone = require('keystone');
var async = require('async');

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
						"html": "<h3 id=\"ce-texte-est-en-cours-de-r-vision\">Ce texte est en cours de révision</h3>\n<p>Le texte ci-dessus n&#39;est pas définitif et la communauté compte sur vos contributions. Vous pouvez contribuer ci-dessous en ajoutant des sources d&#39;information complémentaires au texte ou en proposant des modifications sur le texte lui-même.</p>\n",
						"md": "### Ce texte est en cours de révision\r\n\r\nLe texte ci-dessus n'est pas définitif et la communauté compte sur vos contributions. Vous pouvez contribuer ci-dessous en ajoutant des sources d'information complémentaires au texte ou en proposant des modifications sur le texte lui-même."
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