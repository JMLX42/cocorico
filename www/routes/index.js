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

function isAuthenticated(req, res, next)
{
	if (!req.isAuthenticated() || !req.user.sub)
		return res.status(401).apiResponse({ 'error': 'not logged in' });

	next();
}

// Setup Route Bindings
exports = module.exports = function(app) {

	app.use(passport.initialize());
	app.use(passport.session());

	app.get('/', routes.views.index);

	app.get('/auth/login', keystone.middleware.api, routes.auth.index.login);
	app.get('/auth/logout', keystone.middleware.api, routes.auth.index.logout);
	app.get('/auth/connectCallback', keystone.middleware.api, routes.auth.index.connectCallback);

	app.get('/api/text/list', keystone.middleware.api, routes.api.text.list);
	app.get('/api/text/latest', keystone.middleware.api, routes.api.text.latest);
	app.get('/api/text/:id', keystone.middleware.api, routes.api.text.get);
	app.get('/api/text/getBySlug/:slug', keystone.middleware.api, routes.api.text.getBySlug);
	app.get('/api/text/ballot/:id', keystone.middleware.api, isAuthenticated, routes.api.text.getBallot);
	app.get('/api/text/vote/yes/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteYes);
	app.get('/api/text/vote/blank/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteBlank);
	app.get('/api/text/vote/no/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteNo);
	app.get('/api/text/unvote/:id', keystone.middleware.api, isAuthenticated, routes.api.text.unvote);

	app.get('/api/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/api/page/navbar', keystone.middleware.api, routes.api.page.navbar);
	app.get('/api/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/api/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

	app.get('/api/user/me', keystone.middleware.api, isAuthenticated, routes.api.user.me);
};
