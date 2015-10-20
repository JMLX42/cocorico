var babelify = require('babelify');
var browserify = require('browserify-middleware');
var keystone = require('keystone');
var passport = require('passport');

var importRoutes = keystone.importer(__dirname);

var routes = {
	views: importRoutes('./views'),
	api: importRoutes('./api'),
	auth: importRoutes('./auth')
};

// Setup Route Bindings
exports = module.exports = function(app) {

	app.use(passport.initialize());
	app.use(passport.session());

	app.get('/', routes.views.index);

	app.get('/auth/login', keystone.middleware.api, routes.auth.index.login);

	app.get('/api/poll/list', keystone.middleware.api, routes.api.poll.list);
	app.get('/api/poll/latest', keystone.middleware.api, routes.api.poll.latest);
	app.get('/api/poll/:id', keystone.middleware.api, routes.api.poll.get);

	app.get('/api/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/api/page/navbar', keystone.middleware.api, routes.api.page.list);
	app.get('/api/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/api/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

};
