var keystone = require('keystone');
var async = require('async');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.series([
		function(next) {
			new Page.model({"contentType":"Markdown","createdAt":"2015-10-25T22:54:41.000Z","published":true,"publishedAt":"2015-10-25T22:54:45.000Z","showInNavBar":false,"slug":"politique-de-confidentialite","sortOrder":6,"title":"Politique De Confidentialité","markdown":{"html":"<h1 id=\"politique-de-confidentialit-\">Politique de confidentialité</h1>\n","md":"# Politique de confidentialité\r\n"}}).save(next);
		},
		function(next) { done(); }
	]);
};