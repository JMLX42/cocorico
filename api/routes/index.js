var keystone = require('keystone');
var passport = require('passport');

var config = require('../config.json');

var importRoutes = keystone.importer(__dirname);

var routes = {
	api: importRoutes('./api')
};

function isAuthenticated(req, res, next)
{
	// FIXME: users should be able to login without FranceConnect for offline dev
	if (!req.isAuthenticated() || !req.user.sub)
		return res.status(401).apiResponse({ 'error': 'not logged in' });

	next();
}

// Setup Route Bindings
exports = module.exports = function(app) {

	app.use(passport.initialize());
	app.use(passport.session());

	app.post('/oauth/token', routes.api.oauth.token);

	app.get('/auth/providers', keystone.middleware.api, routes.api.auth.providers);
	app.get('/auth/logout', keystone.middleware.api, routes.api.auth.logout);
	if (config.franceConnect) {
		app.get('/auth/france-connect/login', keystone.middleware.api, routes.api.auth.franceConnectLogin);
		app.get('/auth/france-connect/callback', keystone.middleware.api, routes.api.auth.franceConnectCallback);
	}
	if (config.facebook) {
		app.get('/auth/facebook/login',  keystone.middleware.api, routes.api.auth.facebookLogin);
		app.get('/auth/facebook/callback', keystone.middleware.api, routes.api.auth.facebookCallback);
	}
	if (config.google) {
		app.get('/auth/google/login',  keystone.middleware.api, routes.api.auth.googleLogin);
		app.get('/auth/google/callback', keystone.middleware.api, routes.api.auth.googleCallback);
	}
	if (config.env == 'development') {
		app.get('/auth/fakeLogin', keystone.middleware.api, routes.api.auth.fakeLogin);
	}

	app.get('/vote/list', keystone.middleware.api, routes.api.vote.list);
	app.get('/vote/:voteId', keystone.middleware.api, routes.api.vote.get);
	app.get('/vote/by-slug/:voteSlug', keystone.middleware.api, routes.api.vote.getBySlug);
	app.post('/vote', keystone.middleware.api, routes.api.oauth.checkAccessToken, routes.api.vote.create);
	app.get('/vote/result/:voteId', keystone.middleware.api, routes.api.vote.result);
	app.get('/vote/result/per-gender/:voteId', keystone.middleware.api, routes.api.vote.resultPerGender);
	app.get('/vote/result/per-age/:voteId', keystone.middleware.api, routes.api.vote.resultPerAge);
	app.get('/vote/result/per-date/:voteId', keystone.middleware.api, routes.api.vote.resultPerDate);
	app.get('/vote/embed/:voteId', keystone.middleware.api, routes.api.vote.embed);

	app.get('/ballot/list', keystone.middleware.api, isAuthenticated, routes.api.ballot.list);
	app.get('/ballot/:voteId', keystone.middleware.api, isAuthenticated, routes.api.ballot.get);
	app.post('/ballot/:voteId', keystone.middleware.api, isAuthenticated, routes.api.ballot.vote);
	// app.post('/ballot/cancel/:voteId', keystone.middleware.api, isAuthenticated, routes.api.ballot.cancel);

	app.get('/source/:voteId', keystone.middleware.api, routes.api.source.list);
	// app.post('/source/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.source.addLike);
	// app.post('/source/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.source.removeLike);

	app.get('/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/page/navbar', keystone.middleware.api, routes.api.page.navbar);
	app.get('/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

	app.get('/user/me', keystone.middleware.api, isAuthenticated, routes.api.user.me);

	app.get('/service/status', keystone.middleware.api, routes.api.service.getStatus);

	app.get('/redirect', keystone.middleware.api, routes.api.redirect.redirect);
	app.get('/redirect/proxy', routes.api.redirect.proxy);
};
