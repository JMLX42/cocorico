import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import passport from 'passport';
import winston from 'winston';
import expressWinston from 'express-winston';
import raven from 'raven';

import logger from '../logger';

const Event = keystone.list('Event');

const importRoutes = keystone.importer(__dirname);

const routes = {
  api: importRoutes('./api'),
};

logger.info('imported routes');

function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated() || !req.user.sub)
    return res.status(401).apiResponse({error: 'not authenticated'});
  return next();
}

// Setup Route Bindings
export default function(app) {

  if (!!config.sentry) {
    const sentryUri = 'https://' + config.sentry.public_key
      + ':' + config.sentry.secret
      + '@sentry.io/'
      + config.sentry.project_id;

    app.use(raven.middleware.express.requestHandler(sentryUri));
    app.use(raven.middleware.express.errorHandler(sentryUri));
  }

  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console({
        label: 'api',
        json: true,
        colorize: true,
        level: 'debug',
        timestamp: true,
      }),
    ],
    bodyBlacklist: ['user'],
    requestFilter: config.environment !== 'production'
      ? null
      : (req, propName) => {
        if (propName === 'headers') {
          if ('authorization' in req.headers) {
            var authMethod = req.headers.authorization.split(' ')[0];
            req.headers.authorization = (!!authMethod ? authMethod + ' ' : '')
              + '*****';
          }

          delete req.headers.referer;
        }

        return req[propName];
      },
    colorize: true,
  }));
  app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        label: 'api',
        json: true,
        colorize: true,
      }),
    ],
  }));

  logger.info('initialize passport');
  app.use(passport.initialize());
  app.use(passport.session());
  logger.info('initialized passport');

  logger.info('setup keystone middleware');
  app.use(keystone.middleware.api);

  // JWT authentication does not use sessions, so we have to check for a user
  // without throwing an error if there is none.
  logger.info('setup JWT authentication middleware');
  app.use((req, res, next) => passport.authenticate('jwt', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // if the JWT authentication failed
      if (!!info) {

        await Event.logWarningEventAndBlacklist(
          req, 'JWT forgery attempt detected'
        );

        return res.status(401).apiResponse({
          error: 'authentication failed',
          message: info.message,
        });
      }
      return next();
    }

    return req.logIn(user, { session: false }, next);
  })(req, res, next));

  logger.info('setup routes');

  /**
   * @apiDefine user A user that has been properly logged in using any of the `/auth` endpoints.
   */

  /**
   * @apiDefine app A registered 3rd party app providing a valid OAuth token fetched using `/oauth/token`.
   */

  app.get('/ping', (req, res) => res.apiResponse('pong'));

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
   *     curl -X POST
   *      -H "Authorization: Basic NTdjYzI2NDYzMGI2NWMxZTA0YWNjMDlhOm1lZXR1cA=="
   *      -F "grant_type=client_credentials"
   *      "https://cocorico.cc/api/oauth/token"
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
   * @apiParam (POST) {Boolean} url The URL of the original vote content page.
   * @apiParam (POST) {Boolean} restricted (Optionnal) Restrict the vote to
   * the users provided by the app. Default value is `false`.
   * @apiParam (POST) {String[]} labels (Optionnal) The vote proposal labels.
   * @apiParam (POST) {String} title (Optionnal) The title of the vote. If missing,
   * the value is read from the vote's URL `og:title` OpenGraph tag.
   * @apiParam (POST) {String} image (Optionnal) The URL of the image of the vote. If missing,
   * the value is read from the vote's URL `og:image` OpenGraph tag.
   * @apiParam (POST) {String} description (Optionnal) The description of the
   * vote. If missing, the value is read from the vote's URL `og:description` OpenGraph
   * tag.
   * @apiParam (POST) {String[]} labels (Optionnal) The ballot value labels.
   * @apiParam (POST) {String} question (Optionnal) The question that will be asked
   * to the voter.
   *
   * @apiExample {curl} cURL example:
   *     curl -X POST
   *      -H "Authorization: Bearer i45dj3ii2kkvhlgsjfh2hhce4wkk06tx5"
   *      -F "url=https://www.meetup.com/fr-FR/promenades-et-randonnees/"
   *      "https://cocorico.cc/api/vote"
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
   * @apiSuccess {String} vote.labels The ballot value labels.
   * @apiSuccess {String} vote.question The question that will be asked
   * to the voter.
   */
  app.post('/vote', routes.api.oauth.checkAccessToken, routes.api.vote.create);

  /**
   * @api {get} /vote List all votes
   * @apiName ListAllVotes
   * @apiGroup Vote
   * @apiVersion 0.0.1
   *
   * @apiExample {curl} cURL example:
   *     curl -X GET "https://cocorico.cc/api/vote"
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
   * @apiSuccess {String} vote.labels The ballot value labels.
   * @apiSuccess {String} vote.question The question that will be asked
   * to the voter.
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
   *     curl -X GET "https://cocorico.cc/api/vote/57cc487608875ef57ac75ff1"
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
   * @apiSuccess {String} vote.labels The ballot value labels.
   * @apiSuccess {String} vote.question The question that will be asked
   * to the voter.
   */
  app.get('/vote/:voteId', routes.api.vote.get);

  /**
   * @api {get} /vote/result/:voteId Get a vote result
   * @apiName GetVoteResult
   * @apiGroup Vote
   * @apiVersion 0.0.1
   *
   * @apiParam {String} voteId The ID of the vote.
   *
   * @apiExample {curl} cURL example:
   *     curl -X GET "https://cocorico.cc/api/vote/result/57cc487608875ef57ac75ff1"
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
   * @apiParam (POST) {String} title (Optionnal) The title of the vote. If missing,
   * the value is read from the vote's URL `og:title` OpenGraph tag.
   * @apiParam (POST) {String} status (Optionnal) The status of the vote.
   * @apiParam (POST) {String} image (Optionnal) The URL of the image of the vote. If missing,
   * the value is read from the vote's URL `og:image` OpenGraph tag.
   * @apiParam (POST) {String} description (Optionnal) The description of the
   * vote. If missing, the value is read from the vote's URL `og:description` OpenGraph
   * tag.
   */
  app.put('/vote/:voteId', routes.api.oauth.checkAccessToken, routes.api.vote.update);

  // app.get('/vote/result/per-gender/:voteId', routes.api.vote.resultPerGender);
  // app.get('/vote/result/per-age/:voteId', routes.api.vote.resultPerAge);
  // app.get('/vote/result/per-date/:voteId', routes.api.vote.resultPerDate);
  app.get('/vote/embed/:voteId', routes.api.vote.embed);

  app.get('/vote/permissions/:voteId', routes.api.vote.permissions);

  /**
   * @api {get} /ballot/transactions/:voteId Get ballot transactions
   * @apiName GetTransactions
   * @apiGroup Ballot
   * @apiVersion 0.0.1
   *
   * @apiParam {String} voteId The ID of the vote.
   *
   * @apiExample {curl} cURL example:
   *     curl -X GET "https://cocorico.cc/api/ballot/transactions/57cc487608875ef57ac75ff1"
   */
  app.post('/ballot/transactions/:voteId', routes.api.ballot.getTransactions);

  /**
   * @api {post} /ballot/verify/:voteId Verify a ballot
   * @apiName VerifyBallot
   * @apiGroup Ballot
   * @apiVersion 0.0.1
   *
   * @apiParam (POST) {String} proofOfVote The JWT of the proof of vote to
   * verify returned by a previous call to [the POST `/ballot/:voteId` API endpoint](#api-Ballot-SendBallot).
   *
   * @apiExample {curl} cURL example:
   *    curl -X POST
   *      -F "proofOfVote=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2IjoxLCJhIjoiNzI3OTk5NzJhYTQ3YjY4YTBhOTliNGUyNTZjN2ZjZmY2MmE5MGUwNSIsImMiOiJkZjVkODcxYjhhMTNiMmU4YzNiMjgwOTZiYWQ4YWEzN2IzZDM1YjdhIiwicCI6MSwidCI6MTQ3NTA1MDE5MzIyOX0.AncBGzKm2Sa-iCXGnnBsFn7WqqYC1Z0Yi9wWJ5H_ghk"
   *      "https://cocorico.cc/api/ballot/verify"
   */
  app.post('/ballot/verify', routes.api.ballot.verify);

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
   *    import jquery from 'jquery';
   *    import lightwallet from 'eth-lightwallet';
   *
   *     var tx = lightwallet.txutils.functionTx(
   *      voteContractABI,
   *      'vote',
   *      [ballotValue],
   *      {
   *        to: voteContractAddress,
   *        gasLimit: 999999,
   *         gasPrice: 20000000000,
   *         nonce: 0
   *       }
   *     );
   *     var signedTx = '0x' + lightwallet.signing.signTx(
   *      keystore,
   *      pwDerivedKey,
   *      tx,
   *      address
   *    );
   *
   *     jquery.post(
   *       '/api/ballot/' + voteId,
   *       { transaction: signedTx },
   *       (data) => {
   *         console.log('ballot transaction sent');
   *       }
   *     );
   *
   * @apiParam {String} voteId The ID of the vote.
   *
   * @apiParam (POST) {String} transaction The blockchain transaction of the
   * ballot.
   *
   * @apiSuccess {Object} ballot The created ballot object.
   * @apiSuccess {String} ballot.id The ID of the ballot.
   * @apiSuccess {String} ballot.status The status of the ballot.
   * @apiSuccess {String} ballot.hash The signature of the user who sent the
   * ballot.
   * @apiSuccess {String} ballot.error The message of the error that happened
   * when processing the ballot, if any.
   * @apiSuccess {Object} proofOfVote A JWT signed by the server to verify the
   * ballot using [the `/ballot/verify` API endpoint](#api-Ballot-VerifyBallot).
   *
   */
  app.post('/ballot/:voteId', isAuthenticated, routes.api.ballot.post);

  app.get('/source/:voteId', routes.api.source.list);

  app.get('/page/list', routes.api.page.list);
  app.get('/page/:id', routes.api.page.get);
  app.get('/page/getBySlug/:slug', routes.api.page.getBySlug);

  app.get('/user/me', isAuthenticated, routes.api.user.me);

  app.get('/service/status', routes.api.service.getStatus);

  app.get('/redirect', routes.api.redirect.redirect);
  app.get('/redirect/proxy', routes.api.redirect.proxy);
};
