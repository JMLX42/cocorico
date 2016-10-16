var passport = require('passport');
var keystone = require('keystone');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var App = keystone.list('App');

var config = require('/opt/cocorico/api-web/config.json');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

exports.providers = function(req, res) {
  var providers = [];

  if (config.facebook)
    providers.push({name: 'facebook', url: '/api/auth/facebook/login'});

  if (config.franceConnect)
    providers.push({name: 'france-connect', url: '/api/auth/france-connect/login'});

  if (config.google)
    providers.push({name: 'google', url: '/api/auth/google/login'});

  res.apiResponse({ providers : providers });
}

exports.logout = function(req, res) {
  req.logout();

  return res.redirect(302, req.query.redirect ? req.query.redirect : '/');
}

exports.fakeLogin = function(req, res) {
  user = {
    sub: '1234567890',
    firstName: 'Fake',
    lastName: 'User',
    gender: 'male',
    birthdate: '1987-05-16',
  };

  req.login(user, function(err) {
    return res.apiResponse(user);
  });
}

function getLoginFunction(provider, options) {
  return function(req, res) {
    if (req.query.redirect)
      req.session.redirectAfterLogin = req.query.redirect;

    passport.authenticate(provider, options)(req, res);
  };
}

function getLoginCallbackFunction(provider) {
  return (req, res) => {
    if (req.query && req.query.state && !req.query.error && req.session.state !== req.query.state)
      return res.status(404).apiResponse({error: {'name': 'invalid_state', 'message': 'invalid state'}});

    return passport.authenticate(
      provider,
      (authenticateErr, user) => {
        if (authenticateErr)
          return res.apiResponse({error: authenticateErr});

        if (!user) {
          var errorName = res.req.query.error;
          var errorDescription = res.req.query.error_description;

          return res.send({error: {'name': errorName, 'message': errorDescription}});
        }

        return req.login(user, (err) => {
          if (req.session.redirectAfterLogin) {
            var redirect = req.session.redirectAfterLogin;

            delete req.session.redirectAfterLogin;
            return res.redirect(302, redirect);
          } else {
            return res.redirect(302, '/');
          }
        });
      }
    )(req, res);
  }
}

if (config.franceConnect) {
  var FranceConnectStrategy = require('passport-franceconnect').Strategy;

  passport.use('france-connect', new FranceConnectStrategy(
    {
      // authorizationURL: config.franceConnect.oauth.authorizationURL,
      // tokenURL: config.franceConnect.oauth.tokenURL,
      clientID: config.franceConnect.openIDConnectStrategyParameters.clientID,
      clientSecret: config.franceConnect.openIDConnectStrategyParameters.clientSecret,
      callbackURL: config.franceConnect.oauth.callbackURL,
      // userInfoURL: config.franceConnect.openIDConnectStrategyParameters.userInfoURL,
      scope: config.franceConnect.oauth.scopes,
      acrValues: config.franceConnect.openIDConnectStrategyParameters.acr_values,
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      var user = {
        sub: profile._json.sub,
        firstName: profile._json.given_name,
        lastName: profile._json.family_name,
        gender: profile._json.gender,
        birthdate: profile._json.birthdate,
      };

      return done(null, user);
    }
  ));

  exports.franceConnectLogin = getLoginFunction('france-connect', {scope: config.franceConnect.oauth.scope});

  exports.franceConnectCallback = getLoginCallbackFunction('france-connect');
}

if (config.facebook) {
  var FacebookStrategy = require('passport-facebook').Strategy;

  passport.use(new FacebookStrategy(
    {
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
      profileFields: ['id', 'birthday', 'email', 'first_name', 'gender', 'last_name'],
    },
    (accessToken, refreshToken, profile, cb) => {
      var user = {
        sub : 'facebook:' + profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        gender: profile.gender,
        birthdate: profile._json.birthday,
      };

      return cb(null, user);
    }
  ));

  exports.facebookLogin = getLoginFunction('facebook', { scope: [ 'public_profile', 'user_birthday' ] });

  exports.facebookCallback = getLoginCallbackFunction('facebook');
}

if (config.google) {
  var GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy(
    {
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
    },
    (accessToken, refreshToken, profile, cb) => {
      var user = {
        sub : 'google:' + profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        gender: profile.gender,
      };

      if (profile._json.birthday)
        user.birthday = profile._json.birthday;

      return cb(null, user);
    }
  ));

  exports.googleLogin = getLoginFunction('google', { scope: [ 'profile' ] });

  exports.googleCallback = getLoginCallbackFunction('google');
}

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
// secretOrKey is not really important since we will set it dynamically according
// to the "Cocorico-App-Id" HTTP header. But it still has to be != false.
opts.secretOrKey = 'secret';
opts.ignoreExpiration = false;

// JwtStrategy reads the JWT secret from the option object above. But
// we need the secret to be the one set for the corresponding App.
// Thus, we override the JwtStrategy.prototype.authenticate method in order to set
// the secret according to the App found using the "Cocorico-App-Id" header.
var authenticate = JwtStrategy.prototype.authenticate;
JwtStrategy.prototype.authenticate = function(req, options) {
  var token = this._jwtFromRequest(req);
  if (!token) {
    return this.fail();
  }

  var appId = req.headers['cocorico-app-id'];

  if (!appId) {
    return this.fail(new Error('Missing Cocorico-App-Id header'));
  }

  return App.model.findById(appId).exec((err, app) => {
    if (err) {
      return this.fail(err);
    }

    if (!app) {
      return this.fail(new Error('Invalid app id'));
    }

    this._verifOpts.issuer = app.id;
    this._secretOrKey = app.secret;

    return authenticate.call(this, req, options);
  });
}

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  if (!!jwt_payload.sub) {
        // At this point, we know for sure the secret and the issuer are correct.
        // So we can safely assume that jwt_payload.iss is the right App ID and
        // use it to make sure the "sub" is unique across multiple apps.
    jwt_payload.sub = jwt_payload.iss + ':' + jwt_payload.sub;

    return done(null, jwt_payload);
  }

  return done(null, false);
}));
