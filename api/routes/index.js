var config = require('../config.json');
var keystone = require('keystone');
var passport = require('passport');

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

	app.get('/auth/login', keystone.middleware.api, routes.api.auth.login);
	app.get('/auth/logout', keystone.middleware.api, routes.api.auth.logout);
	app.get('/auth/connectCallback', keystone.middleware.api, routes.api.auth.connectCallback);
	if (config.env == 'development')
		app.get('/auth/fakeLogin', keystone.middleware.api, routes.api.auth.fakeLogin);

	app.get('/bill/list', keystone.middleware.api, routes.api.bill.list);
	app.get('/bill/latest', keystone.middleware.api, routes.api.bill.latest);
	app.get('/bill/:id', keystone.middleware.api, routes.api.bill.get);
	app.get('/bill/getBySlug/:slug', keystone.middleware.api, routes.api.bill.getBySlug);
	app.get('/bill/ballot/:id', keystone.middleware.api, isAuthenticated, routes.api.bill.getBallot);
	app.post('/bill/save', keystone.middleware.api, isAuthenticated, routes.api.bill.save);
	// app.get('/bill/delete/:id', keystone.middleware.api, isAuthenticated, routes.api.bill.delete);
	app.get('/bill/status/:id/:status', keystone.middleware.api, isAuthenticated, routes.api.bill.status);
	app.get('/bill/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.bill.addLike);
	app.get('/bill/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.bill.removeLike);
	app.get('/bill/part/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.bill.addBillPartLike);
	app.get('/bill/part/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.bill.removeBillPartLike);

	app.get('/vote/result/:billId', keystone.middleware.api, routes.api.vote.result);
	app.get('/vote/result/per-gender/:billId', keystone.middleware.api, routes.api.vote.resultPerGender);
	app.get('/vote/result/per-age/:billId', keystone.middleware.api, routes.api.vote.resultPerAge);
	app.get('/vote/result/per-date/:billId', keystone.middleware.api, routes.api.vote.resultPerDate);
	app.get('/vote/yes/:id', keystone.middleware.api, isAuthenticated, routes.api.vote.voteYes);
	app.get('/vote/blank/:id', keystone.middleware.api, isAuthenticated, routes.api.vote.voteBlank);
	app.get('/vote/no/:id', keystone.middleware.api, isAuthenticated, routes.api.vote.voteNo);
	app.get('/vote/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.vote.remove);

	app.get('/source/list/:billId', keystone.middleware.api, routes.api.source.list);
	app.post('/source/add', keystone.middleware.api, isAuthenticated, routes.api.source.add);
	app.get('/source/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.source.addLike);
	app.get('/source/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.source.removeLike);

	app.get('/argument/list/:billId', keystone.middleware.api, routes.api.argument.list);
	app.post('/argument/add', keystone.middleware.api, isAuthenticated, routes.api.argument.add);
	app.get('/argument/like/add/:id/:value', keystone.middleware.api, isAuthenticated, routes.api.argument.addLike);
	app.get('/argument/like/remove/:id', keystone.middleware.api, isAuthenticated, routes.api.argument.removeLike);

	app.get('/page/list', keystone.middleware.api, routes.api.page.list);
	app.get('/page/navbar', keystone.middleware.api, routes.api.page.navbar);
	app.get('/page/:id', keystone.middleware.api, routes.api.page.get);
	app.get('/page/getBySlug/:slug', keystone.middleware.api, routes.api.page.getBySlug);

	app.get('/user/me', keystone.middleware.api, isAuthenticated, routes.api.user.me);
	app.get('/user/bills', keystone.middleware.api, isAuthenticated, routes.api.user.bills);

	app.get('/service/status', keystone.middleware.api, routes.api.service.getStatus);
};
