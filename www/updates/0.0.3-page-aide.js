var keystone = require('keystone');
var async = require('async');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.series([
		function(next) {
			new Page.model({"contentType":"Markdown","createdAt":"2015-10-25T22:19:29.000Z","published":true,"publishedAt":"2015-10-25T22:19:32.000Z","showInNavBar":true,"slug":"aide","sortOrder":5,"title":"Aide","markdown":{"html":"<h1 id=\"aide\">Aide</h1>\n","md":"# Aide\r\n"}}).save(next);
		},
		function(next) { done(); }
	]);
};