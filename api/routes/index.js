var keystone = require('keystone');
var passport = require('passport');

var config = require('../config.json');

var importRoutes = keystone.importer(__dirname);

var routes = {
  api: importRoutes('./api'),
};

function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated() || !req.user.sub)
    return res.status(401).apiResponse({error: 'not authenticated'});
  return next();
}

// Setup Route Bindings
exports = module.exports = function(app) {

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(keystone.middleware.api);

	// JWT authentication does not use sessions, so we have to check for a user
	// without throwing an error if there is none.
  app.use((req, res, next) => passport.authenticate('jwt', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
			// if the JWT authentification failed
      if (info) {
        return res.status(401).apiResponse({
          error: 'authentification failed',
          message: info.message,
        });
      }
      return next();
    }

    return req.logIn(user, { session: false }, next);
  })(req, res, next));

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
