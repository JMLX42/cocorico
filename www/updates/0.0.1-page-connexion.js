var keystone = require('keystone');
var async = require('async');

var Page = keystone.list('Page');
var Media = keystone.list('Media');

module.exports = function(done) {
	async.series([
		function(next) {
			new Page.model({"contentType":"HTML","createdAt":"2015-10-24T10:30:18.000Z","html":"<p><a href=\"../../auth/login\"> <img src=\"../../upload/franceconnect-button.png\" alt=\"\" /> </a></p>","published":true,"publishedAt":"2015-10-24T10:32:31.000Z","showInNavBar":false,"slug":"connexion","sortOrder":2,"title":"Connexion"}).save(next);
		},
		function(next) { done(); }
	]);
};