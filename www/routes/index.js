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
	app.get('/auth/logout', keystone.middleware.api, routes.auth.index.logout);
	app.get('/auth/connectCallback', keystone.middleware.api, routes.auth.index.connectCallback);

	app.get('/api/poll/list', keystone.middleware.api, routes.api.poll.list);
	app.get('/api/poll/latest', keystone.middleware.api, routes.api.poll.latest);
	app.get('/api/poll/:id', keystone.middleware.api, routes.api.poll.get);
	app.get('/api/poll/getBySlug/:slug', keystone.middleware.api, routes.api.poll.getBySlug);
	app.get('/api/poll/vote/:id', keystone.middleware.api, routes.api.poll.getVote);
	app.get('/api/poll/vote/yes/:id', keystone.middleware.api, routes.api.poll.voteYes);
	app.get('/api/poll/vote/blank/:id', keystone.middleware.api, routes.api.poll.voteBlank);
	app.get('/api/poll/vote/no/:id', keystone.middleware.api, routes.api.poll.voteNo);

	app.get('/api/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/api/page/navbar', keystone.middleware.api, routes.api.page.navbar);
	app.get('/api/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/api/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

	app.get('/api/user/me', keystone.middleware.api, routes.api.user.me);
};
