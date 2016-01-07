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
	// FIXME: users should be able to login without FranceConnect for offline dev
	if (!req.isAuthenticated() || !req.user.sub)
		return res.status(401).apiResponse({ 'error': 'not logged in' });

	next();
}

function checkCSRFToken(req, res, next)
{
	if (!keystone.security.csrf.validate(req))
		return res.status(400).apiResponse({ 'error': 'invalid CSRF token' });

	next();
}

// Setup Route Bindings
exports = module.exports = function(app) {

	app.use(passport.initialize());
	app.use(passport.session());


	app.get('/auth/login', keystone.middleware.api, routes.auth.index.login);
	app.get('/auth/logout', keystone.middleware.api, routes.auth.index.logout);
	app.get('/auth/connectCallback', keystone.middleware.api, routes.auth.index.connectCallback);
	// FIXME: only in dev environment
	app.get('/auth/fakeLogin', keystone.middleware.api, routes.auth.index.fakeLogin);

	app.get('/api/text/list', keystone.middleware.api, routes.api.text.list);
	app.get('/api/text/latest', keystone.middleware.api, routes.api.text.latest);
	app.get('/api/text/:id', keystone.middleware.api, routes.api.text.get);
	app.get('/api/text/getBySlug/:slug', keystone.middleware.api, routes.api.text.getBySlug);
	app.get('/api/text/ballot/:id', keystone.middleware.api, isAuthenticated, routes.api.text.getBallot);
	app.get('/api/text/vote/yes/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteYes);
	app.get('/api/text/vote/blank/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteBlank);
	app.get('/api/text/vote/no/:id', keystone.middleware.api, isAuthenticated, routes.api.text.voteNo);
	app.get('/api/text/unvote/:id', keystone.middleware.api, isAuthenticated, routes.api.text.unvote);
	app.post('/api/text/save', keystone.middleware.api, isAuthenticated, routes.api.text.save);
	// app.get('/api/text/delete/:id', keystone.middleware.api, isAuthenticated, routes.api.text.delete);
	app.get('/api/text/status/:id/:status', keystone.middleware.api, isAuthenticated, routes.api.text.status);
	app.get('/api/text/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.text.addLike);
	app.get('/api/text/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.text.removeLike);

	app.get('/api/vote/result/:textId', keystone.middleware.api, routes.api.vote.result);

	app.get('/api/source/list/:textId', keystone.middleware.api, routes.api.source.list);
	app.post('/api/source/add', keystone.middleware.api, isAuthenticated, routes.api.source.add);
	app.get('/api/source/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.source.addLike);
	app.get('/api/source/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.source.removeLike);

	app.get('/api/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/api/page/navbar', keystone.middleware.api, routes.api.page.navbar);
	app.get('/api/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/api/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

	app.get('/api/user/me', keystone.middleware.api, isAuthenticated, routes.api.user.me);
	app.get('/api/user/texts', keystone.middleware.api, isAuthenticated, routes.api.user.texts);

	app.get('*', routes.views.index);
};
