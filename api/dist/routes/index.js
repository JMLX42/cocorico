'use strict';

var keystone = require('keystone');
var passport = require('passport');

var config = require('/opt/cocorico/api-web/config.json');

var importRoutes = keystone.importer(__dirname);

var routes = {
	api: importRoutes('./api')
};

function isAuthenticated(req, res, next) {
	if (!req.isAuthenticated() || !req.user.sub) return res.status(401).apiResponse({ error: 'not authenticated' });
	return next();
}

// Setup Route Bindings
exports = module.exports = function (app) {

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(keystone.middleware.api);

	// JWT authentication does not use sessions, so we have to check for a user
	// without throwing an error if there is none.
	app.use(function (req, res, next) {
		return passport.authenticate('jwt', function (err, user, info) {
			if (err) {
				return next(err);
			}
			if (!user) {
				// if the JWT authentification failed
				if (info) {
					return res.status(401).apiResponse({
						error: 'authentification failed',
						message: info.message
					});
				}
				return next();
			}

			return req.logIn(user, { session: false }, next);
		})(req, res, next);
	});

	/**
  * @apiDefine user A user that has been properly logged in using any of the `/auth` endpoints.
  */

	/**
  * @apiDefine app A registered 3rd party app providing a valid OAuth token fetched using `/oauth/token`.
  */

	/**
  * @api {post} /oauth/token Get an OAuth access token
  * @apiName GetOAuthToken
  * @apiGroup OAuth
  * @apiVersion 0.0.1
  *
  * @apiHeader {String} Authorization The HTTP Basic authentication token: `base64(appId:secret)`
  * @apiParam (POST) {String} grant_type Must be "client_credentials".
  *
  * @apiExample {curl} cURL example:
  * 		curl -X POST
  *			-H "Authorization: Basic NTdjYzI2NDYzMGI2NWMxZTA0YWNjMDlhOm1lZXR1cA=="
  *			-F "grant_type=client_credentials"
  *			"https://cocorico.cc/api/oauth/token"
  *
  * @apiSuccess {String} auth_token OAuth access token.
  * @apiSuccess {Number} expires_in Expiration delay.
  * @apiSuccess {String} token_type Acess token type.
  */
	app.post('/oauth/token', routes.api.oauth.token);

	app.get('/auth/providers', routes.api.auth.providers);
	app.get('/auth/logout', routes.api.auth.logout);
	if (config.franceConnect) {
		app.get('/auth/france-connect/login', routes.api.auth.franceConnectLogin);
		app.get('/auth/france-connect/callback', routes.api.auth.franceConnectCallback);
	}
	if (config.facebook) {
		app.get('/auth/facebook/login', routes.api.auth.facebookLogin);
		app.get('/auth/facebook/callback', routes.api.auth.facebookCallback);
	}
	if (config.google) {
		app.get('/auth/google/login', routes.api.auth.googleLogin);
		app.get('/auth/google/callback', routes.api.auth.googleCallback);
	}
	if (config.env === 'development') {
		app.get('/auth/fakeLogin', routes.api.auth.fakeLogin);
	}

	/**
  * @api {post} /vote Create a new vote
  * @apiName CreateNewVote
  * @apiGroup Vote
  * @apiVersion 0.0.1
  * @apiPermission app
  *
  * @apiHeader {String} Authorization The OAuth access token fetched with `/oauth/token`.
  *
  * @apiParam (POST) {Boolean} restricted (Optionnal) Restrict the vote to
  * the users provided by the app. Default value is `false`.
  * @apiParam (POST) {String[]} labels (Optionnal) The vote proposal labels.
  *
  * @apiExample {curl} cURL example:
  * 		curl -X POST
  *			-H "Authorization: Bearer i45dj3ii2kkvhlgsjfh2hhce4wkk06tx5"
  *			-F "url=https://www.meetup.com/fr-FR/promenades-et-randonnees/"
  *			"https://cocorico.cc/api/vote"
  *
  * @apiSuccess {Object} vote The newly created vote.
  * @apiSuccess {String} vote.id The ID of the vote.
  * @apiSuccess {Object} vote.vote The newly created Vote.
  * @apiSuccess {String} vote.app The ID of the App that created the vote.
  * @apiSuccess {Number} vote.description The description of the vote.
  * @apiSuccess {String} vote.image The image of the vote.
  * @apiSuccess {String} vote.slug The slug of the vote.
  * @apiSuccess {String} vote.title The title of the vote.
  * @apiSuccess {String} vote.url The URL passed to create the vote.
  * @apiSuccess {String} vote.status The status of the vote.
  * @apiSuccess {Object[]} vote.voteContractABI The ABI of the vote blockchain smart contract.
  * @apiSuccess {String} vote.voteContractAddress The blockchain block address of the vote smart contract.
  */
	app.post('/vote', routes.api.oauth.checkAccessToken, routes.api.vote.create);

	/**
  * @api {get} /vote List all votes
  * @apiName ListAllVotes
  * @apiGroup Vote
  * @apiVersion 0.0.1
  *
  * @apiExample {curl} cURL example:
  * 		curl -X GET "https://cocorico.cc/api/vote"
  *
  * @apiSuccess {Object[]} votes List of votes.
  * @apiSuccess {String} votes.id The ID of the vote.
  * @apiSuccess {Object} votes.vote The newly created Vote.
  * @apiSuccess {String} votes.app The ID of the App that created the vote.
  * @apiSuccess {Number} votes.description The description of the vote.
  * @apiSuccess {String} votes.image The image of the vote.
  * @apiSuccess {String} votes.slug The slug of the vote.
  * @apiSuccess {String} votes.title The title of the vote.
  * @apiSuccess {String} votes.url The URL passed to create the vote.
  * @apiSuccess {String} votes.status The status of the vote.
  * @apiSuccess {Object[]} votes.voteContractABI The ABI of the vote blockchain smart contract.
  * @apiSuccess {String} votes.voteContractAddress The blockchain block address of the vote smart contract.
  */
	app.get('/vote', routes.api.vote.list);

	/**
  * @api {get} /vote/:voteId Get a specific vote
  * @apiName GetSpecificVote
  * @apiGroup Vote
  * @apiVersion 0.0.1
  *
  * @apiParam {String} voteId The ID of the vote.
  *
  * @apiExample {curl} cURL example:
  * 		curl -X GET "https://cocorico.cc/api/vote/57cc487608875ef57ac75ff1"
  *
  * @apiSuccess {Object} vote The requested vote.
  * @apiSuccess {String} vote.id The ID of the vote.
  * @apiSuccess {Object} vote.vote The newly created Vote.
  * @apiSuccess {String} vote.app The ID of the App that created the vote.
  * @apiSuccess {Number} vote.description The description of the vote.
  * @apiSuccess {String} vote.image The image of the vote.
  * @apiSuccess {String} vote.slug The slug of the vote.
  * @apiSuccess {String} vote.title The title of the vote.
  * @apiSuccess {String} vote.url The URL passed to create the vote.
  * @apiSuccess {String} vote.status The status of the vote.
  * @apiSuccess {Object[]} vote.voteContractABI The ABI of the vote blockchain smart contract.
  * @apiSuccess {String} vote.voteContractAddress The blockchain block address of the vote smart contract.
  */
	app.get('/vote/:voteId', routes.api.vote.get);

	/**
  * @api {get} /vote/transactions/:voteId Get transactions from voteId
  * @apiName GetTransactions
  * @apiGroup Vote
  * @apiVersion 0.0.1
  *
  * @apiParam {String} voteId The ID of the vote.
  *
  * @apiExample {curl} cURL example:
  * 		curl -X GET "https://cocorico.cc/api/vote/transactions/57cc487608875ef57ac75ff1"
  */
	app.get('/vote/transactions/:voteId', routes.api.vote.getTransactions);

	/**
  * @api {get} /vote/result/:voteId Get a vote result
  * @apiName GetVoteResult
  * @apiGroup Vote
  * @apiVersion 0.0.1
  *
  * @apiParam {String} voteId The ID of the vote.
  *
  * @apiExample {curl} cURL example:
  * 		curl -X GET "https://cocorico.cc/api/vote/result/57cc487608875ef57ac75ff1"
  *
  * @apiSuccess {Object} vote The requested vote result.
  */
	app.get('/vote/result/:voteId', routes.api.vote.result);

	app.get('/vote/by-slug/:voteSlug', routes.api.vote.getBySlug);

	/**
  * @api {put} /vote/:voteId Update a vote
  * @apiName UpdateVote
  * @apiGroup Vote
  * @apiVersion 0.0.1
  * @apiPermission app
  *
  * @apiParam {String} voteId The ID of the vote.
  */
	app.put('/vote/:voteId', routes.api.oauth.checkAccessToken, routes.api.vote.update);

	// app.get('/vote/result/per-gender/:voteId', routes.api.vote.resultPerGender);
	// app.get('/vote/result/per-age/:voteId', routes.api.vote.resultPerAge);
	// app.get('/vote/result/per-date/:voteId', routes.api.vote.resultPerDate);
	app.get('/vote/embed/:voteId', routes.api.vote.embed);

	app.get('/vote/permissions/:voteId', routes.api.vote.permissions);

	/**
  * @api {get} /ballot/:voteId Get a ballot
  * @apiName GetBallot
  * @apiGroup Ballot
  * @apiVersion 0.0.1
  * @apiPermission user
  *
  * @apiParam {String} voteId The ID of the vote.
  */
	app.get('/ballot/:voteId', isAuthenticated, routes.api.ballot.get);

	/**
  * @api {post} /ballot/:voteId Send a ballot
  * @apiName SendBallot
  * @apiGroup Ballot
  * @apiVersion 0.0.1
  * @apiPermission user
  *
  * @apiDescription Send the user's ballot for a specific vote.
  *
  * The ballot is represented as a blockchain transaction signed with a client-side generated public/private key pair.
  * This blockchain transaction must call the corresponding vote smart contract instance
  * `vote()` method.
  *
  * @apiExample {javascript} JavaScript example:
  *
  * 		var jquery = require('jquery');
  *		var lightwallet = require('eth-lightwallet');
  *
  * 		var tx = lightwallet.txutils.functionTx(
  *			voteContractABI,
  *			'vote',
  *			[ballotValue],
  *			{
  *				to: voteContractAddress,
  *				gasLimit: 999999,
  * 				gasPrice: 20000000000,
  * 				nonce: 0
  * 			}
  * 		);
  * 		var signedTx = '0x' + lightwallet.signing.signTx(
  *			keystore,
  *			pwDerivedKey,
  *			tx,
  *			address
  *		);
  *
  * 		jquery.post(
  * 			'/api/ballot/' + voteId,
  * 			{ transaction: signedTx },
  * 			(data) => {
  * 				console.log('ballot transaction sent');
  * 			}
  * 		);
  *
  * @apiParam {String} voteId The ID of the vote.
  *
  * @apiParam (POST) {String} transaction The blockchain transaction of the ballot.
  *
  */
	app.post('/ballot/:voteId', isAuthenticated, routes.api.ballot.vote);
	// app.post('/ballot/cancel/:voteId', isAuthenticated, routes.api.ballot.cancel);

	app.get('/source/:voteId', routes.api.source.list);
	// app.post('/source/like/add/:id/:value', isAuthenticated, routes.api.source.addLike);
	// app.post('/source/like/remove/:id', isAuthenticated, routes.api.source.removeLike);

	app.get('/page/list', routes.api.page.list);
	app.get('/page/navbar', routes.api.page.navbar);
	app.get('/page/:id', routes.api.page.get);
	app.get('/page/getBySlug/:slug', routes.api.page.getBySlug);

	app.get('/user/me', isAuthenticated, routes.api.user.me);

	app.get('/service/status', routes.api.service.getStatus);

	app.get('/redirect', routes.api.redirect.redirect);
	app.get('/redirect/proxy', routes.api.redirect.proxy);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvaW5kZXguanMiXSwibmFtZXMiOlsia2V5c3RvbmUiLCJyZXF1aXJlIiwicGFzc3BvcnQiLCJjb25maWciLCJpbXBvcnRSb3V0ZXMiLCJpbXBvcnRlciIsIl9fZGlybmFtZSIsInJvdXRlcyIsImFwaSIsImlzQXV0aGVudGljYXRlZCIsInJlcSIsInJlcyIsIm5leHQiLCJ1c2VyIiwic3ViIiwic3RhdHVzIiwiYXBpUmVzcG9uc2UiLCJlcnJvciIsImV4cG9ydHMiLCJtb2R1bGUiLCJhcHAiLCJ1c2UiLCJpbml0aWFsaXplIiwic2Vzc2lvbiIsIm1pZGRsZXdhcmUiLCJhdXRoZW50aWNhdGUiLCJlcnIiLCJpbmZvIiwibWVzc2FnZSIsImxvZ0luIiwicG9zdCIsIm9hdXRoIiwidG9rZW4iLCJnZXQiLCJhdXRoIiwicHJvdmlkZXJzIiwibG9nb3V0IiwiZnJhbmNlQ29ubmVjdCIsImZyYW5jZUNvbm5lY3RMb2dpbiIsImZyYW5jZUNvbm5lY3RDYWxsYmFjayIsImZhY2Vib29rIiwiZmFjZWJvb2tMb2dpbiIsImZhY2Vib29rQ2FsbGJhY2siLCJnb29nbGUiLCJnb29nbGVMb2dpbiIsImdvb2dsZUNhbGxiYWNrIiwiZW52IiwiZmFrZUxvZ2luIiwiY2hlY2tBY2Nlc3NUb2tlbiIsInZvdGUiLCJjcmVhdGUiLCJsaXN0IiwiZ2V0VHJhbnNhY3Rpb25zIiwicmVzdWx0IiwiZ2V0QnlTbHVnIiwicHV0IiwidXBkYXRlIiwiZW1iZWQiLCJwZXJtaXNzaW9ucyIsImJhbGxvdCIsInNvdXJjZSIsInBhZ2UiLCJuYXZiYXIiLCJtZSIsInNlcnZpY2UiLCJnZXRTdGF0dXMiLCJyZWRpcmVjdCIsInByb3h5Il0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLFdBQVdDLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBSUMsV0FBV0QsUUFBUSxVQUFSLENBQWY7O0FBRUEsSUFBSUUsU0FBU0YsUUFBUSxtQ0FBUixDQUFiOztBQUVBLElBQUlHLGVBQWVK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aUJBQVIsRUFBMkIxQixPQUFPQyxHQUFQLENBQVd3RCxPQUFYLENBQW1CQyxTQUE5Qzs7QUFFQTdDLEtBQUlhLEdBQUosQ0FBUSxXQUFSLEVBQXFCMUIsT0FBT0MsR0FBUCxDQUFXMEQsUUFBWCxDQUFvQkEsUUFBekM7QUFDQTlDLEtBQUlhLEdBQUosQ0FBUSxpQkFBUixFQUEyQjFCLE9BQU9DLEdBQVAsQ0FBVzBELFFBQVgsQ0FBb0JDLEtBQS9DO0FBQ0QsQ0E1UkQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIga2V5c3RvbmUgPSByZXF1aXJlKCdrZXlzdG9uZScpO1xudmFyIHBhc3Nwb3J0ID0gcmVxdWlyZSgncGFzc3BvcnQnKTtcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy9vcHQvY29jb3JpY28vYXBpLXdlYi9jb25maWcuanNvbicpO1xuXG52YXIgaW1wb3J0Um91dGVzID0ga2V5c3RvbmUuaW1wb3J0ZXIoX19kaXJuYW1lKTtcblxudmFyIHJvdXRlcyA9IHtcbiAgYXBpOiBpbXBvcnRSb3V0ZXMoJy4vYXBpJyksXG59O1xuXG5mdW5jdGlvbiBpc0F1dGhlbnRpY2F0ZWQocmVxLCByZXMsIG5leHQpIHtcbiAgaWYgKCFyZXEuaXNBdXRoZW50aWNhdGVkKCkgfHwgIXJlcS51c2VyLnN1YilcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmFwaVJlc3BvbnNlKHtlcnJvcjogJ25vdCBhdXRoZW50aWNhdGVkJ30pO1xuICByZXR1cm4gbmV4dCgpO1xufVxuXG4vLyBTZXR1cCBSb3V0ZSBCaW5kaW5nc1xuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXBwKSB7XG5cbiAgYXBwLnVzZShwYXNzcG9ydC5pbml0aWFsaXplKCkpO1xuICBhcHAudXNlKHBhc3Nwb3J0LnNlc3Npb24oKSk7XG5cbiAgYXBwLnVzZShrZXlzdG9uZS5taWRkbGV3YXJlLmFwaSk7XG5cblx0Ly8gSldUIGF1dGhlbnRpY2F0aW9uIGRvZXMgbm90IHVzZSBzZXNzaW9ucywgc28gd2UgaGF2ZSB0byBjaGVjayBmb3IgYSB1c2VyXG5cdC8vIHdpdGhvdXQgdGhyb3dpbmcgYW4gZXJyb3IgaWYgdGhlcmUgaXMgbm9uZS5cbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnand0JywgKGVyciwgdXNlciwgaW5mbykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBuZXh0KGVycik7XG4gICAgfVxuICAgIGlmICghdXNlcikge1xuXHRcdFx0Ly8gaWYgdGhlIEpXVCBhdXRoZW50aWZpY2F0aW9uIGZhaWxlZFxuICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5hcGlSZXNwb25zZSh7XG4gICAgICAgICAgZXJyb3I6ICdhdXRoZW50aWZpY2F0aW9uIGZhaWxlZCcsXG4gICAgICAgICAgbWVzc2FnZTogaW5mby5tZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcS5sb2dJbih1c2VyLCB7IHNlc3Npb246IGZhbHNlIH0sIG5leHQpO1xuICB9KShyZXEsIHJlcywgbmV4dCkpO1xuXG5cdC8qKlxuXHQgKiBAYXBpRGVmaW5lIHVzZXIgQSB1c2VyIHRoYXQgaGFzIGJlZW4gcHJvcGVybHkgbG9nZ2VkIGluIHVzaW5nIGFueSBvZiB0aGUgYC9hdXRoYCBlbmRwb2ludHMuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAYXBpRGVmaW5lIGFwcCBBIHJlZ2lzdGVyZWQgM3JkIHBhcnR5IGFwcCBwcm92aWRpbmcgYSB2YWxpZCBPQXV0aCB0b2tlbiBmZXRjaGVkIHVzaW5nIGAvb2F1dGgvdG9rZW5gLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGFwaSB7cG9zdH0gL29hdXRoL3Rva2VuIEdldCBhbiBPQXV0aCBhY2Nlc3MgdG9rZW5cblx0ICogQGFwaU5hbWUgR2V0T0F1dGhUb2tlblxuXHQgKiBAYXBpR3JvdXAgT0F1dGhcblx0ICogQGFwaVZlcnNpb24gMC4wLjFcblx0ICpcblx0ICogQGFwaUhlYWRlciB7U3RyaW5nfSBBdXRob3JpemF0aW9uIFRoZSBIVFRQIEJhc2ljIGF1dGhlbnRpY2F0aW9uIHRva2VuOiBgYmFzZTY0KGFwcElkOnNlY3JldClgXG5cdCAqIEBhcGlQYXJhbSAoUE9TVCkge1N0cmluZ30gZ3JhbnRfdHlwZSBNdXN0IGJlIFwiY2xpZW50X2NyZWRlbnRpYWxzXCIuXG5cdCAqXG5cdCAqIEBhcGlFeGFtcGxlIHtjdXJsfSBjVVJMIGV4YW1wbGU6XG5cdCAqIFx0XHRjdXJsIC1YIFBPU1Rcblx0ICpcdFx0XHQtSCBcIkF1dGhvcml6YXRpb246IEJhc2ljIE5UZGpZekkyTkRZek1HSTJOV014WlRBMFlXTmpNRGxoT20xbFpYUjFjQT09XCJcblx0ICpcdFx0XHQtRiBcImdyYW50X3R5cGU9Y2xpZW50X2NyZWRlbnRpYWxzXCJcblx0ICpcdFx0XHRcImh0dHBzOi8vY29jb3JpY28uY2MvYXBpL29hdXRoL3Rva2VuXCJcblx0ICpcblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gYXV0aF90b2tlbiBPQXV0aCBhY2Nlc3MgdG9rZW4uXG5cdCAqIEBhcGlTdWNjZXNzIHtOdW1iZXJ9IGV4cGlyZXNfaW4gRXhwaXJhdGlvbiBkZWxheS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdG9rZW5fdHlwZSBBY2VzcyB0b2tlbiB0eXBlLlxuXHQgKi9cbiAgYXBwLnBvc3QoJy9vYXV0aC90b2tlbicsIHJvdXRlcy5hcGkub2F1dGgudG9rZW4pO1xuXG4gIGFwcC5nZXQoJy9hdXRoL3Byb3ZpZGVycycsIHJvdXRlcy5hcGkuYXV0aC5wcm92aWRlcnMpO1xuICBhcHAuZ2V0KCcvYXV0aC9sb2dvdXQnLCByb3V0ZXMuYXBpLmF1dGgubG9nb3V0KTtcbiAgaWYgKGNvbmZpZy5mcmFuY2VDb25uZWN0KSB7XG4gICAgYXBwLmdldCgnL2F1dGgvZnJhbmNlLWNvbm5lY3QvbG9naW4nLCByb3V0ZXMuYXBpLmF1dGguZnJhbmNlQ29ubmVjdExvZ2luKTtcbiAgICBhcHAuZ2V0KCcvYXV0aC9mcmFuY2UtY29ubmVjdC9jYWxsYmFjaycsIHJvdXRlcy5hcGkuYXV0aC5mcmFuY2VDb25uZWN0Q2FsbGJhY2spO1xuICB9XG4gIGlmIChjb25maWcuZmFjZWJvb2spIHtcbiAgICBhcHAuZ2V0KCcvYXV0aC9mYWNlYm9vay9sb2dpbicsIHJvdXRlcy5hcGkuYXV0aC5mYWNlYm9va0xvZ2luKTtcbiAgICBhcHAuZ2V0KCcvYXV0aC9mYWNlYm9vay9jYWxsYmFjaycsIHJvdXRlcy5hcGkuYXV0aC5mYWNlYm9va0NhbGxiYWNrKTtcbiAgfVxuICBpZiAoY29uZmlnLmdvb2dsZSkge1xuICAgIGFwcC5nZXQoJy9hdXRoL2dvb2dsZS9sb2dpbicsIHJvdXRlcy5hcGkuYXV0aC5nb29nbGVMb2dpbik7XG4gICAgYXBwLmdldCgnL2F1dGgvZ29vZ2xlL2NhbGxiYWNrJywgcm91dGVzLmFwaS5hdXRoLmdvb2dsZUNhbGxiYWNrKTtcbiAgfVxuICBpZiAoY29uZmlnLmVudiA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIGFwcC5nZXQoJy9hdXRoL2Zha2VMb2dpbicsIHJvdXRlcy5hcGkuYXV0aC5mYWtlTG9naW4pO1xuICB9XG5cblx0LyoqXG5cdCAqIEBhcGkge3Bvc3R9IC92b3RlIENyZWF0ZSBhIG5ldyB2b3RlXG5cdCAqIEBhcGlOYW1lIENyZWF0ZU5ld1ZvdGVcblx0ICogQGFwaUdyb3VwIFZvdGVcblx0ICogQGFwaVZlcnNpb24gMC4wLjFcblx0ICogQGFwaVBlcm1pc3Npb24gYXBwXG5cdCAqXG5cdCAqIEBhcGlIZWFkZXIge1N0cmluZ30gQXV0aG9yaXphdGlvbiBUaGUgT0F1dGggYWNjZXNzIHRva2VuIGZldGNoZWQgd2l0aCBgL29hdXRoL3Rva2VuYC5cblx0ICpcblx0ICogQGFwaVBhcmFtIChQT1NUKSB7Qm9vbGVhbn0gcmVzdHJpY3RlZCAoT3B0aW9ubmFsKSBSZXN0cmljdCB0aGUgdm90ZSB0b1xuXHQgKiB0aGUgdXNlcnMgcHJvdmlkZWQgYnkgdGhlIGFwcC4gRGVmYXVsdCB2YWx1ZSBpcyBgZmFsc2VgLlxuXHQgKiBAYXBpUGFyYW0gKFBPU1QpIHtTdHJpbmdbXX0gbGFiZWxzIChPcHRpb25uYWwpIFRoZSB2b3RlIHByb3Bvc2FsIGxhYmVscy5cblx0ICpcblx0ICogQGFwaUV4YW1wbGUge2N1cmx9IGNVUkwgZXhhbXBsZTpcblx0ICogXHRcdGN1cmwgLVggUE9TVFxuXHQgKlx0XHRcdC1IIFwiQXV0aG9yaXphdGlvbjogQmVhcmVyIGk0NWRqM2lpMmtrdmhsZ3NqZmgyaGhjZTR3a2swNnR4NVwiXG5cdCAqXHRcdFx0LUYgXCJ1cmw9aHR0cHM6Ly93d3cubWVldHVwLmNvbS9mci1GUi9wcm9tZW5hZGVzLWV0LXJhbmRvbm5lZXMvXCJcblx0ICpcdFx0XHRcImh0dHBzOi8vY29jb3JpY28uY2MvYXBpL3ZvdGVcIlxuXHQgKlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0fSB2b3RlIFRoZSBuZXdseSBjcmVhdGVkIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUuaWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0fSB2b3RlLnZvdGUgVGhlIG5ld2x5IGNyZWF0ZWQgVm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5hcHAgVGhlIElEIG9mIHRoZSBBcHAgdGhhdCBjcmVhdGVkIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7TnVtYmVyfSB2b3RlLmRlc2NyaXB0aW9uIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5pbWFnZSBUaGUgaW1hZ2Ugb2YgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUuc2x1ZyBUaGUgc2x1ZyBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS50aXRsZSBUaGUgdGl0bGUgb2YgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUudXJsIFRoZSBVUkwgcGFzc2VkIHRvIGNyZWF0ZSB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5zdGF0dXMgVGhlIHN0YXR1cyBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge09iamVjdFtdfSB2b3RlLnZvdGVDb250cmFjdEFCSSBUaGUgQUJJIG9mIHRoZSB2b3RlIGJsb2NrY2hhaW4gc21hcnQgY29udHJhY3QuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUudm90ZUNvbnRyYWN0QWRkcmVzcyBUaGUgYmxvY2tjaGFpbiBibG9jayBhZGRyZXNzIG9mIHRoZSB2b3RlIHNtYXJ0IGNvbnRyYWN0LlxuXHQgKi9cbiAgYXBwLnBvc3QoJy92b3RlJywgcm91dGVzLmFwaS5vYXV0aC5jaGVja0FjY2Vzc1Rva2VuLCByb3V0ZXMuYXBpLnZvdGUuY3JlYXRlKTtcblxuXHQvKipcblx0ICogQGFwaSB7Z2V0fSAvdm90ZSBMaXN0IGFsbCB2b3Rlc1xuXHQgKiBAYXBpTmFtZSBMaXN0QWxsVm90ZXNcblx0ICogQGFwaUdyb3VwIFZvdGVcblx0ICogQGFwaVZlcnNpb24gMC4wLjFcblx0ICpcblx0ICogQGFwaUV4YW1wbGUge2N1cmx9IGNVUkwgZXhhbXBsZTpcblx0ICogXHRcdGN1cmwgLVggR0VUIFwiaHR0cHM6Ly9jb2Nvcmljby5jYy9hcGkvdm90ZVwiXG5cdCAqXG5cdCAqIEBhcGlTdWNjZXNzIHtPYmplY3RbXX0gdm90ZXMgTGlzdCBvZiB2b3Rlcy5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZXMuaWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0fSB2b3Rlcy52b3RlIFRoZSBuZXdseSBjcmVhdGVkIFZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGVzLmFwcCBUaGUgSUQgb2YgdGhlIEFwcCB0aGF0IGNyZWF0ZWQgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtOdW1iZXJ9IHZvdGVzLmRlc2NyaXB0aW9uIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZXMuaW1hZ2UgVGhlIGltYWdlIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7U3RyaW5nfSB2b3Rlcy5zbHVnIFRoZSBzbHVnIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7U3RyaW5nfSB2b3Rlcy50aXRsZSBUaGUgdGl0bGUgb2YgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGVzLnVybCBUaGUgVVJMIHBhc3NlZCB0byBjcmVhdGUgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGVzLnN0YXR1cyBUaGUgc3RhdHVzIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0W119IHZvdGVzLnZvdGVDb250cmFjdEFCSSBUaGUgQUJJIG9mIHRoZSB2b3RlIGJsb2NrY2hhaW4gc21hcnQgY29udHJhY3QuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGVzLnZvdGVDb250cmFjdEFkZHJlc3MgVGhlIGJsb2NrY2hhaW4gYmxvY2sgYWRkcmVzcyBvZiB0aGUgdm90ZSBzbWFydCBjb250cmFjdC5cblx0ICovXG4gIGFwcC5nZXQoJy92b3RlJywgcm91dGVzLmFwaS52b3RlLmxpc3QpO1xuXG5cdC8qKlxuXHQgKiBAYXBpIHtnZXR9IC92b3RlLzp2b3RlSWQgR2V0IGEgc3BlY2lmaWMgdm90ZVxuXHQgKiBAYXBpTmFtZSBHZXRTcGVjaWZpY1ZvdGVcblx0ICogQGFwaUdyb3VwIFZvdGVcblx0ICogQGFwaVZlcnNpb24gMC4wLjFcblx0ICpcblx0ICogQGFwaVBhcmFtIHtTdHJpbmd9IHZvdGVJZCBUaGUgSUQgb2YgdGhlIHZvdGUuXG5cdCAqXG5cdCAqIEBhcGlFeGFtcGxlIHtjdXJsfSBjVVJMIGV4YW1wbGU6XG5cdCAqIFx0XHRjdXJsIC1YIEdFVCBcImh0dHBzOi8vY29jb3JpY28uY2MvYXBpL3ZvdGUvNTdjYzQ4NzYwODg3NWVmNTdhYzc1ZmYxXCJcblx0ICpcblx0ICogQGFwaVN1Y2Nlc3Mge09iamVjdH0gdm90ZSBUaGUgcmVxdWVzdGVkIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUuaWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0fSB2b3RlLnZvdGUgVGhlIG5ld2x5IGNyZWF0ZWQgVm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5hcHAgVGhlIElEIG9mIHRoZSBBcHAgdGhhdCBjcmVhdGVkIHRoZSB2b3RlLlxuXHQgKiBAYXBpU3VjY2VzcyB7TnVtYmVyfSB2b3RlLmRlc2NyaXB0aW9uIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5pbWFnZSBUaGUgaW1hZ2Ugb2YgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUuc2x1ZyBUaGUgc2x1ZyBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS50aXRsZSBUaGUgdGl0bGUgb2YgdGhlIHZvdGUuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUudXJsIFRoZSBVUkwgcGFzc2VkIHRvIGNyZWF0ZSB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge1N0cmluZ30gdm90ZS5zdGF0dXMgVGhlIHN0YXR1cyBvZiB0aGUgdm90ZS5cblx0ICogQGFwaVN1Y2Nlc3Mge09iamVjdFtdfSB2b3RlLnZvdGVDb250cmFjdEFCSSBUaGUgQUJJIG9mIHRoZSB2b3RlIGJsb2NrY2hhaW4gc21hcnQgY29udHJhY3QuXG5cdCAqIEBhcGlTdWNjZXNzIHtTdHJpbmd9IHZvdGUudm90ZUNvbnRyYWN0QWRkcmVzcyBUaGUgYmxvY2tjaGFpbiBibG9jayBhZGRyZXNzIG9mIHRoZSB2b3RlIHNtYXJ0IGNvbnRyYWN0LlxuXHQgKi9cbiAgYXBwLmdldCgnL3ZvdGUvOnZvdGVJZCcsIHJvdXRlcy5hcGkudm90ZS5nZXQpO1xuXG5cdC8qKlxuXHQgKiBAYXBpIHtnZXR9IC92b3RlL3RyYW5zYWN0aW9ucy86dm90ZUlkIEdldCB0cmFuc2FjdGlvbnMgZnJvbSB2b3RlSWRcblx0ICogQGFwaU5hbWUgR2V0VHJhbnNhY3Rpb25zXG5cdCAqIEBhcGlHcm91cCBWb3RlXG5cdCAqIEBhcGlWZXJzaW9uIDAuMC4xXG5cdCAqXG5cdCAqIEBhcGlQYXJhbSB7U3RyaW5nfSB2b3RlSWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKlxuXHQgKiBAYXBpRXhhbXBsZSB7Y3VybH0gY1VSTCBleGFtcGxlOlxuXHQgKiBcdFx0Y3VybCAtWCBHRVQgXCJodHRwczovL2NvY29yaWNvLmNjL2FwaS92b3RlL3RyYW5zYWN0aW9ucy81N2NjNDg3NjA4ODc1ZWY1N2FjNzVmZjFcIlxuXHQgKi9cbiAgYXBwLmdldCgnL3ZvdGUvdHJhbnNhY3Rpb25zLzp2b3RlSWQnLCByb3V0ZXMuYXBpLnZvdGUuZ2V0VHJhbnNhY3Rpb25zKTtcblxuXHQvKipcblx0ICogQGFwaSB7Z2V0fSAvdm90ZS9yZXN1bHQvOnZvdGVJZCBHZXQgYSB2b3RlIHJlc3VsdFxuXHQgKiBAYXBpTmFtZSBHZXRWb3RlUmVzdWx0XG5cdCAqIEBhcGlHcm91cCBWb3RlXG5cdCAqIEBhcGlWZXJzaW9uIDAuMC4xXG5cdCAqXG5cdCAqIEBhcGlQYXJhbSB7U3RyaW5nfSB2b3RlSWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKlxuXHQgKiBAYXBpRXhhbXBsZSB7Y3VybH0gY1VSTCBleGFtcGxlOlxuXHQgKiBcdFx0Y3VybCAtWCBHRVQgXCJodHRwczovL2NvY29yaWNvLmNjL2FwaS92b3RlL3Jlc3VsdC81N2NjNDg3NjA4ODc1ZWY1N2FjNzVmZjFcIlxuXHQgKlxuXHQgKiBAYXBpU3VjY2VzcyB7T2JqZWN0fSB2b3RlIFRoZSByZXF1ZXN0ZWQgdm90ZSByZXN1bHQuXG5cdCAqL1xuICBhcHAuZ2V0KCcvdm90ZS9yZXN1bHQvOnZvdGVJZCcsIHJvdXRlcy5hcGkudm90ZS5yZXN1bHQpO1xuXG4gIGFwcC5nZXQoJy92b3RlL2J5LXNsdWcvOnZvdGVTbHVnJywgcm91dGVzLmFwaS52b3RlLmdldEJ5U2x1Zyk7XG5cblx0LyoqXG5cdCAqIEBhcGkge3B1dH0gL3ZvdGUvOnZvdGVJZCBVcGRhdGUgYSB2b3RlXG5cdCAqIEBhcGlOYW1lIFVwZGF0ZVZvdGVcblx0ICogQGFwaUdyb3VwIFZvdGVcblx0ICogQGFwaVZlcnNpb24gMC4wLjFcblx0ICogQGFwaVBlcm1pc3Npb24gYXBwXG5cdCAqXG5cdCAqIEBhcGlQYXJhbSB7U3RyaW5nfSB2b3RlSWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKi9cbiAgYXBwLnB1dCgnL3ZvdGUvOnZvdGVJZCcsIHJvdXRlcy5hcGkub2F1dGguY2hlY2tBY2Nlc3NUb2tlbiwgcm91dGVzLmFwaS52b3RlLnVwZGF0ZSk7XG5cblx0Ly8gYXBwLmdldCgnL3ZvdGUvcmVzdWx0L3Blci1nZW5kZXIvOnZvdGVJZCcsIHJvdXRlcy5hcGkudm90ZS5yZXN1bHRQZXJHZW5kZXIpO1xuXHQvLyBhcHAuZ2V0KCcvdm90ZS9yZXN1bHQvcGVyLWFnZS86dm90ZUlkJywgcm91dGVzLmFwaS52b3RlLnJlc3VsdFBlckFnZSk7XG5cdC8vIGFwcC5nZXQoJy92b3RlL3Jlc3VsdC9wZXItZGF0ZS86dm90ZUlkJywgcm91dGVzLmFwaS52b3RlLnJlc3VsdFBlckRhdGUpO1xuICBhcHAuZ2V0KCcvdm90ZS9lbWJlZC86dm90ZUlkJywgcm91dGVzLmFwaS52b3RlLmVtYmVkKTtcblxuICBhcHAuZ2V0KCcvdm90ZS9wZXJtaXNzaW9ucy86dm90ZUlkJywgcm91dGVzLmFwaS52b3RlLnBlcm1pc3Npb25zKTtcblxuXHQvKipcblx0ICogQGFwaSB7Z2V0fSAvYmFsbG90Lzp2b3RlSWQgR2V0IGEgYmFsbG90XG5cdCAqIEBhcGlOYW1lIEdldEJhbGxvdFxuXHQgKiBAYXBpR3JvdXAgQmFsbG90XG5cdCAqIEBhcGlWZXJzaW9uIDAuMC4xXG5cdCAqIEBhcGlQZXJtaXNzaW9uIHVzZXJcblx0ICpcblx0ICogQGFwaVBhcmFtIHtTdHJpbmd9IHZvdGVJZCBUaGUgSUQgb2YgdGhlIHZvdGUuXG5cdCAqL1xuICBhcHAuZ2V0KCcvYmFsbG90Lzp2b3RlSWQnLCBpc0F1dGhlbnRpY2F0ZWQsIHJvdXRlcy5hcGkuYmFsbG90LmdldCk7XG5cblx0LyoqXG5cdCAqIEBhcGkge3Bvc3R9IC9iYWxsb3QvOnZvdGVJZCBTZW5kIGEgYmFsbG90XG5cdCAqIEBhcGlOYW1lIFNlbmRCYWxsb3Rcblx0ICogQGFwaUdyb3VwIEJhbGxvdFxuXHQgKiBAYXBpVmVyc2lvbiAwLjAuMVxuXHQgKiBAYXBpUGVybWlzc2lvbiB1c2VyXG5cdCAqXG5cdCAqIEBhcGlEZXNjcmlwdGlvbiBTZW5kIHRoZSB1c2VyJ3MgYmFsbG90IGZvciBhIHNwZWNpZmljIHZvdGUuXG5cdCAqXG5cdCAqIFRoZSBiYWxsb3QgaXMgcmVwcmVzZW50ZWQgYXMgYSBibG9ja2NoYWluIHRyYW5zYWN0aW9uIHNpZ25lZCB3aXRoIGEgY2xpZW50LXNpZGUgZ2VuZXJhdGVkIHB1YmxpYy9wcml2YXRlIGtleSBwYWlyLlxuXHQgKiBUaGlzIGJsb2NrY2hhaW4gdHJhbnNhY3Rpb24gbXVzdCBjYWxsIHRoZSBjb3JyZXNwb25kaW5nIHZvdGUgc21hcnQgY29udHJhY3QgaW5zdGFuY2Vcblx0ICogYHZvdGUoKWAgbWV0aG9kLlxuXHQgKlxuXHQgKiBAYXBpRXhhbXBsZSB7amF2YXNjcmlwdH0gSmF2YVNjcmlwdCBleGFtcGxlOlxuXHQgKlxuXHQgKiBcdFx0dmFyIGpxdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXHQgKlx0XHR2YXIgbGlnaHR3YWxsZXQgPSByZXF1aXJlKCdldGgtbGlnaHR3YWxsZXQnKTtcblx0ICpcblx0ICogXHRcdHZhciB0eCA9IGxpZ2h0d2FsbGV0LnR4dXRpbHMuZnVuY3Rpb25UeChcblx0ICpcdFx0XHR2b3RlQ29udHJhY3RBQkksXG5cdCAqXHRcdFx0J3ZvdGUnLFxuXHQgKlx0XHRcdFtiYWxsb3RWYWx1ZV0sXG5cdCAqXHRcdFx0e1xuXHQgKlx0XHRcdFx0dG86IHZvdGVDb250cmFjdEFkZHJlc3MsXG5cdCAqXHRcdFx0XHRnYXNMaW1pdDogOTk5OTk5LFxuXHQgKiBcdFx0XHRcdGdhc1ByaWNlOiAyMDAwMDAwMDAwMCxcblx0ICogXHRcdFx0XHRub25jZTogMFxuXHQgKiBcdFx0XHR9XG5cdCAqIFx0XHQpO1xuXHQgKiBcdFx0dmFyIHNpZ25lZFR4ID0gJzB4JyArIGxpZ2h0d2FsbGV0LnNpZ25pbmcuc2lnblR4KFxuXHQgKlx0XHRcdGtleXN0b3JlLFxuXHQgKlx0XHRcdHB3RGVyaXZlZEtleSxcblx0ICpcdFx0XHR0eCxcblx0ICpcdFx0XHRhZGRyZXNzXG5cdCAqXHRcdCk7XG5cdCAqXG5cdCAqIFx0XHRqcXVlcnkucG9zdChcblx0ICogXHRcdFx0Jy9hcGkvYmFsbG90LycgKyB2b3RlSWQsXG5cdCAqIFx0XHRcdHsgdHJhbnNhY3Rpb246IHNpZ25lZFR4IH0sXG5cdCAqIFx0XHRcdChkYXRhKSA9PiB7XG5cdCAqIFx0XHRcdFx0Y29uc29sZS5sb2coJ2JhbGxvdCB0cmFuc2FjdGlvbiBzZW50Jyk7XG5cdCAqIFx0XHRcdH1cblx0ICogXHRcdCk7XG5cdCAqXG5cdCAqIEBhcGlQYXJhbSB7U3RyaW5nfSB2b3RlSWQgVGhlIElEIG9mIHRoZSB2b3RlLlxuXHQgKlxuXHQgKiBAYXBpUGFyYW0gKFBPU1QpIHtTdHJpbmd9IHRyYW5zYWN0aW9uIFRoZSBibG9ja2NoYWluIHRyYW5zYWN0aW9uIG9mIHRoZSBiYWxsb3QuXG5cdCAqXG5cdCAqL1xuICBhcHAucG9zdCgnL2JhbGxvdC86dm90ZUlkJywgaXNBdXRoZW50aWNhdGVkLCByb3V0ZXMuYXBpLmJhbGxvdC52b3RlKTtcblx0Ly8gYXBwLnBvc3QoJy9iYWxsb3QvY2FuY2VsLzp2b3RlSWQnLCBpc0F1dGhlbnRpY2F0ZWQsIHJvdXRlcy5hcGkuYmFsbG90LmNhbmNlbCk7XG5cbiAgYXBwLmdldCgnL3NvdXJjZS86dm90ZUlkJywgcm91dGVzLmFwaS5zb3VyY2UubGlzdCk7XG5cdC8vIGFwcC5wb3N0KCcvc291cmNlL2xpa2UvYWRkLzppZC86dmFsdWUnLCBpc0F1dGhlbnRpY2F0ZWQsIHJvdXRlcy5hcGkuc291cmNlLmFkZExpa2UpO1xuXHQvLyBhcHAucG9zdCgnL3NvdXJjZS9saWtlL3JlbW92ZS86aWQnLCBpc0F1dGhlbnRpY2F0ZWQsIHJvdXRlcy5hcGkuc291cmNlLnJlbW92ZUxpa2UpO1xuXG4gIGFwcC5nZXQoJy9wYWdlL2xpc3QnLCByb3V0ZXMuYXBpLnBhZ2UubGlzdCk7XG4gIGFwcC5nZXQoJy9wYWdlL25hdmJhcicsIHJvdXRlcy5hcGkucGFnZS5uYXZiYXIpO1xuICBhcHAuZ2V0KCcvcGFnZS86aWQnLCByb3V0ZXMuYXBpLnBhZ2UuZ2V0KTtcbiAgYXBwLmdldCgnL3BhZ2UvZ2V0QnlTbHVnLzpzbHVnJywgcm91dGVzLmFwaS5wYWdlLmdldEJ5U2x1Zyk7XG5cbiAgYXBwLmdldCgnL3VzZXIvbWUnLCBpc0F1dGhlbnRpY2F0ZWQsIHJvdXRlcy5hcGkudXNlci5tZSk7XG5cbiAgYXBwLmdldCgnL3NlcnZpY2Uvc3RhdHVzJywgcm91dGVzLmFwaS5zZXJ2aWNlLmdldFN0YXR1cyk7XG5cbiAgYXBwLmdldCgnL3JlZGlyZWN0Jywgcm91dGVzLmFwaS5yZWRpcmVjdC5yZWRpcmVjdCk7XG4gIGFwcC5nZXQoJy9yZWRpcmVjdC9wcm94eScsIHJvdXRlcy5hcGkucmVkaXJlY3QucHJveHkpO1xufTtcbiJdfQ==