var babelify = require('babelify');
var browserify = require('browserify-middleware');
var keystone = require('keystone');

var importRoutes = keystone.importer(__dirname);

var routes = {
	views: importRoutes('./views'),
	api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function(app) {

	app.get('/', routes.views.index);

	app.get('/api/poll/list', keystone.middleware.api, routes.api.poll.list);
	app.get('/api/poll/latest', keystone.middleware.api, routes.api.poll.latest);
	app.get('/api/poll/:id', keystone.middleware.api, routes.api.poll.get);

};
