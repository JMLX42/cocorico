'use strict';

var passport = require('passport');
var keystone = require('keystone');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var App = keystone.list('App');

var config = require('/opt/cocorico/api-web/config.json');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

exports.providers = function (req, res) {
  var providers = [];

  if (config.facebook) providers.push({ name: 'facebook', url: '/api/auth/facebook/login' });

  if (config.franceConnect) providers.push({ name: 'france-connect', url: '/api/auth/france-connect/login' });

  if (config.google) providers.push({ name: 'google', url: '/api/auth/google/login' });

  res.apiResponse({ providers: providers });
};

exports.logout = function (req, res) {
  req.logout();

  return res.redirect(302, req.query.redirect ? req.query.redirect : '/');
};

exports.fakeLogin = function (req, res) {
  user = {
    sub: '1234567890',
    firstName: 'Fake',
    lastName: 'User',
    gender: 'male',
    birthdate: '1987-05-16'
  };

  req.login(user, function (err) {
    return res.apiResponse(user);
  });
};

function getLoginFunction(provider, options) {
  return function (req, res) {
    if (req.query.redirect) req.session.redirectAfterLogin = req.query.redirect;

    passport.authenticate(provider, options)(req, res);
  };
}

function getLoginCallbackFunction(provider) {
  return function (req, res) {
    if (req.query && req.query.state && !req.query.error && req.session.state !== req.query.state) return res.status(404).apiResponse({ error: { 'name': 'invalid_state', 'message': 'invalid state' } });

    return passport.authenticate(provider, function (authenticateErr, user) {
      if (authenticateErr) return res.apiResponse({ error: authenticateErr });

      if (!user) {
        var errorName = res.req.query.error;
        var errorDescription = res.req.query.error_description;

        return res.send({ error: { 'name': errorName, 'message': errorDescription } });
      }

      return req.login(user, function (err) {
        if (req.session.redirectAfterLogin) {
          var redirect = req.session.redirectAfterLogin;

          delete req.session.redirectAfterLogin;
          return res.redirect(302, redirect);
        } else {
          return res.redirect(302, '/');
        }
      });
    })(req, res);
  };
}

if (config.franceConnect) {
  var FranceConnectStrategy = require('passport-franceconnect').Strategy;

  passport.use('france-connect', new FranceConnectStrategy({
    // authorizationURL: config.franceConnect.oauth.authorizationURL,
    // tokenURL: config.franceConnect.oauth.tokenURL,
    clientID: config.franceConnect.openIDConnectStrategyParameters.clientID,
    clientSecret: config.franceConnect.openIDConnectStrategyParameters.clientSecret,
    callbackURL: config.franceConnect.oauth.callbackURL,
    // userInfoURL: config.franceConnect.openIDConnectStrategyParameters.userInfoURL,
    scope: config.franceConnect.oauth.scopes,
    acrValues: config.franceConnect.openIDConnectStrategyParameters.acr_values
  }, function (iss, sub, profile, accessToken, refreshToken, done) {
    var user = {
      sub: profile._json.sub,
      firstName: profile._json.given_name,
      lastName: profile._json.family_name,
      gender: profile._json.gender,
      birthdate: profile._json.birthdate
    };

    return done(null, user);
  }));

  exports.franceConnectLogin = getLoginFunction('france-connect', { scope: config.franceConnect.oauth.scope });

  exports.franceConnectCallback = getLoginCallbackFunction('france-connect');
}

if (config.facebook) {
  var FacebookStrategy = require('passport-facebook').Strategy;

  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'birthday', 'email', 'first_name', 'gender', 'last_name']
  }, function (accessToken, refreshToken, profile, cb) {
    var user = {
      sub: 'facebook:' + profile.id,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      gender: profile.gender,
      birthdate: profile._json.birthday
    };

    return cb(null, user);
  }));

  exports.facebookLogin = getLoginFunction('facebook', { scope: ['public_profile', 'user_birthday'] });

  exports.facebookCallback = getLoginCallbackFunction('facebook');
}

if (config.google) {
  var GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL
  }, function (accessToken, refreshToken, profile, cb) {
    var user = {
      sub: 'google:' + profile.id,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      gender: profile.gender
    };

    if (profile._json.birthday) user.birthday = profile._json.birthday;

    return cb(null, user);
  }));

  exports.googleLogin = getLoginFunction('google', { scope: ['profile'] });

  exports.googleCallback = getLoginCallbackFunction('google');
}

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
// secretOrKey is not really important since we will set it dynamically according
// to the "Cocorico-App-Id" HTTP header. But it still has to be != false.
opts.secretOrKey = 'secret';

// JwtStrategy reads the JWT secret from the option object above. But
// we need the secret to be the one set for the corresponding App.
// Thus, we override the JwtStrategy.prototype.authenticate method in order to set
// the secret according to the App found using the "Cocorico-App-Id" header.
var authenticate = JwtStrategy.prototype.authenticate;
JwtStrategy.prototype.authenticate = function (req, options) {
  var _this = this;

  var token = this._jwtFromRequest(req);
  if (!token) {
    return this.fail();
  }

  var appId = req.headers['cocorico-app-id'];

  if (!appId) {
    return this.fail(new Error('Missing Cocorico-App-Id header'));
  }

  return App.model.findById(appId).exec(function (err, app) {
    if (err) {
      return _this.fail(err);
    }

    if (!app) {
      return _this.fail(new Error('Invalid app id'));
    }

    _this._verifOpts.issuer = app.id;
    _this._secretOrKey = app.secret;

    return authenticate.call(_this, req, options);
  });
};

passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
  if (!!jwt_payload.sub) {
    // At this point, we know for sure the secret and the issuer are correct.
    // So we can safely assume that jwt_payload.iss is the right App ID and
    // use it to make sure the "sub" is unique across multiple apps.
    jwt_payload.sub = jwt_payload.iss + ':' + jwt_payload.sub;

    return done(null, jwt_payload);
  }

  return done(null, false);
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYXBpL2F1dGguanMiXSwibmFtZXMiOlsicGFzc3BvcnQiLCJyZXF1aXJlIiwia2V5c3RvbmUiLCJKd3RTdHJhdGVneSIsIlN0cmF0ZWd5IiwiRXh0cmFjdEp3dCIsIkFwcCIsImxpc3QiLCJjb25maWciLCJzZXJpYWxpemVVc2VyIiwidXNlciIsImRvbmUiLCJkZXNlcmlhbGl6ZVVzZXIiLCJleHBvcnRzIiwicHJvdmlkZXJzIiwicmVxIiwicmVzIiwiZmFjZWJvb2siLCJwdXNoIiwibmFtZSIsInVybCIsImZyYW5jZUNvbm5lY3QiLCJnb29nbGUiLCJhcGlSZXNwb25zZSIsImxvZ291dCIsInJlZGlyZWN0IiwicXVlcnkiLCJmYWtlTG9naW4iLCJzdWIiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsImdlbmRlciIsImJpcnRoZGF0ZSIsImxvZ2luIiwiZXJyIiwiZ2V0TG9naW5GdW5jdGlvbiIsInByb3ZpZGVyIiwib3B0aW9ucyIsInNlc3Npb24iLCJyZWRpcmVjdEFmdGVyTG9naW4iLCJhdXRoZW50aWNhdGUiLCJnZXRMb2dpbkNhbGxiYWNrRnVuY3Rpb24iLCJzdGF0ZSIsImVycm9yIiwic3RhdHVzIiwiYXV0aGVudGljYXRlRXJyIiwiZXJyb3JOYW1lIiwiZXJyb3JEZXNjcmlwdGlvbiIsImVycm9yX2Rlc2NyaXB0aW9uIiwic2VuZCIsIkZyYW5jZUNvbm5lY3RTdHJhdGVneSIsInVzZSIsImNsaWVudElEIiwib3BlbklEQ29ubmVjdFN0cmF0ZWd5UGFyYW1ldGVycyIsImNsaWVudFNlY3JldCIsImNhbGxiYWNrVVJMIiwib2F1dGgiLCJzY29wZSIsInNjb3BlcyIsImFjclZhbHVlcyIsImFjcl92YWx1ZXMiLCJpc3MiLCJwcm9maWxlIiwiYWNjZXNzVG9rZW4iLCJyZWZyZXNoVG9rZW4iLCJfanNvbiIsImdpdmVuX25hbWUiLCJmYW1pbHlfbmFtZSIsImZyYW5jZUNvbm5lY3RMb2dpbiIsImZyYW5jZUNvbm5lY3RDYWxsYmFjayIsIkZhY2Vib29rU3RyYXRlZ3kiLCJwcm9maWxlRmllbGRzIiwiY2IiLCJpZCIsImdpdmVuTmFtZSIsImZhbWlseU5hbWUiLCJiaXJ0aGRheSIsImZhY2Vib29rTG9naW4iLCJmYWNlYm9va0NhbGxiYWNrIiwiR29vZ2xlU3RyYXRlZ3kiLCJnb29nbGVMb2dpbiIsImdvb2dsZUNhbGxiYWNrIiwib3B0cyIsImp3dEZyb21SZXF1ZXN0IiwiZnJvbUF1dGhIZWFkZXIiLCJzZWNyZXRPcktleSIsInByb3RvdHlwZSIsInRva2VuIiwiX2p3dEZyb21SZXF1ZXN0IiwiZmFpbCIsImFwcElkIiwiaGVhZGVycyIsIkVycm9yIiwibW9kZWwiLCJmaW5kQnlJZCIsImV4ZWMiLCJhcHAiLCJfdmVyaWZPcHRzIiwiaXNzdWVyIiwiX3NlY3JldE9yS2V5Iiwic2VjcmV0IiwiY2FsbCIsImp3dF9wYXlsb2FkIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLFdBQVdDLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBSUMsV0FBV0QsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFJRSxjQUFjRixRQUFRLGNBQVIsRUFBd0JHLFFBQTFDO0FBQ0EsSUFBSUMsYUFBYUosUUFBUSxjQUFSLEVBQXdCSSxVQUF6Qzs7QUFFQSxJQUFJQyxNQUFNSixTQUFTSyxJQUFULENBQWMsS0FBZCxDQUFWOztBQUVBLElBQUlDLFNBQVNQLFFBQVEsbUNBQVIsQ0FBYjs7QUFFQUQsU0FBU1MsYUFBVCxDQUF1QixVQUFTQyxJQUFULEVBQWVDLElBQWYsRUFBcUI7QUFDMUNBLE9BQUssSUFBTCxFQUFXRCxJQUFYO0FBQ0QsQ0FGRDs7QUFJQVYsU0FBU1ksZUFBVCxDQUF5QixVQUFTRixJQUFULEVBQWVDLElBQWYsRUFBcUI7QUFDNUNBLE9BQUssSUFBTCxFQUFXRCxJQUFYO0FBQ0QsQ0FGRDs7QUFJQUcsUUFBUUMsU0FBUixHQUFvQixVQUFTQyxHQUFULEVBQWNDLEdBQWQsRUFBbUI7QUFDckMsTUFBSUYsWUFBWSxFQUFoQjs7QUFFQSxNQUFJ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LEdBQW9CSCxJQUFJSSxNQUF4Qjs7QUFFQSxXQUFPNUQsYUFBYTZELElBQWIsUUFBd0J0RixHQUF4QixFQUE2QnNCLE9BQTdCLENBQVA7QUFDRCxHQWJNLENBQVA7QUFjRCxDQTFCRDs7QUE0QkFyQyxTQUFTbUQsR0FBVCxDQUFhLElBQUloRCxXQUFKLENBQWdCK0UsSUFBaEIsRUFBc0IsVUFBU29CLFdBQVQsRUFBc0IzRixJQUF0QixFQUE0QjtBQUM3RCxNQUFJLENBQUMsQ0FBQzJGLFlBQVkxRSxHQUFsQixFQUF1QjtBQUNqQjtBQUNBO0FBQ0E7QUFDSjBFLGdCQUFZMUUsR0FBWixHQUFrQjBFLFlBQVl6QyxHQUFaLEdBQWtCLEdBQWxCLEdBQXdCeUMsWUFBWTFFLEdBQXREOztBQUVBLFdBQU9qQixLQUFLLElBQUwsRUFBVzJGLFdBQVgsQ0FBUDtBQUNEOztBQUVELFNBQU8zRixLQUFLLElBQUwsRUFBVyxLQUFYLENBQVA7QUFDRCxDQVhZLENBQWIiLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBwYXNzcG9ydCA9IHJlcXVpcmUoJ3Bhc3Nwb3J0Jyk7XG52YXIga2V5c3RvbmUgPSByZXF1aXJlKCdrZXlzdG9uZScpO1xudmFyIEp3dFN0cmF0ZWd5ID0gcmVxdWlyZSgncGFzc3BvcnQtand0JykuU3RyYXRlZ3k7XG52YXIgRXh0cmFjdEp3dCA9IHJlcXVpcmUoJ3Bhc3Nwb3J0LWp3dCcpLkV4dHJhY3RKd3Q7XG5cbnZhciBBcHAgPSBrZXlzdG9uZS5saXN0KCdBcHAnKTtcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy9vcHQvY29jb3JpY28vYXBpLXdlYi9jb25maWcuanNvbicpO1xuXG5wYXNzcG9ydC5zZXJpYWxpemVVc2VyKGZ1bmN0aW9uKHVzZXIsIGRvbmUpIHtcbiAgZG9uZShudWxsLCB1c2VyKTtcbn0pO1xuXG5wYXNzcG9ydC5kZXNlcmlhbGl6ZVVzZXIoZnVuY3Rpb24odXNlciwgZG9uZSkge1xuICBkb25lKG51bGwsIHVzZXIpO1xufSk7XG5cbmV4cG9ydHMucHJvdmlkZXJzID0gZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgdmFyIHByb3ZpZGVycyA9IFtdO1xuXG4gIGlmIChjb25maWcuZmFjZWJvb2spXG4gICAgcHJvdmlkZXJzLnB1c2goe25hbWU6ICdmYWNlYm9vaycsIHVybDogJy9hcGkvYXV0aC9mYWNlYm9vay9sb2dpbid9KTtcblxuICBpZiAoY29uZmlnLmZyYW5jZUNvbm5lY3QpXG4gICAgcHJvdmlkZXJzLnB1c2goe25hbWU6ICdmcmFuY2UtY29ubmVjdCcsIHVybDogJy9hcGkvYXV0aC9mcmFuY2UtY29ubmVjdC9sb2dpbid9KTtcblxuICBpZiAoY29uZmlnLmdvb2dsZSlcbiAgICBwcm92aWRlcnMucHVzaCh7bmFtZTogJ2dvb2dsZScsIHVybDogJy9hcGkvYXV0aC9nb29nbGUvbG9naW4nfSk7XG5cbiAgcmVzLmFwaVJlc3BvbnNlKHsgcHJvdmlkZXJzIDogcHJvdmlkZXJzIH0pO1xufVxuXG5leHBvcnRzLmxvZ291dCA9IGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gIHJlcS5sb2dvdXQoKTtcblxuICByZXR1cm4gcmVzLnJlZGlyZWN0KDMwMiwgcmVxLnF1ZXJ5LnJlZGlyZWN0ID8gcmVxLnF1ZXJ5LnJlZGlyZWN0IDogJy8nKTtcbn1cblxuZXhwb3J0cy5mYWtlTG9naW4gPSBmdW5jdGlvbihyZXEsIHJlcykge1xuICB1c2VyID0ge1xuICAgIHN1YjogJzEyMzQ1Njc4OTAnLFxuICAgIGZpcnN0TmFtZTogJ0Zha2UnLFxuICAgIGxhc3ROYW1lOiAnVXNlcicsXG4gICAgZ2VuZGVyOiAnbWFsZScsXG4gICAgYmlydGhkYXRlOiAnMTk4Ny0wNS0xNicsXG4gIH07XG5cbiAgcmVxLmxvZ2luKHVzZXIsIGZ1bmN0aW9uKGVycikge1xuICAgIHJldHVybiByZXMuYXBpUmVzcG9uc2UodXNlcik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dpbkZ1bmN0aW9uKHByb3ZpZGVyLCBvcHRpb25zKSB7XG4gIHJldHVybiBmdW5jdGlvbihyZXEsIHJlcykge1xuICAgIGlmIChyZXEucXVlcnkucmVkaXJlY3QpXG4gICAgICByZXEuc2Vzc2lvbi5yZWRpcmVjdEFmdGVyTG9naW4gPSByZXEucXVlcnkucmVkaXJlY3Q7XG5cbiAgICBwYXNzcG9ydC5hdXRoZW50aWNhdGUocHJvdmlkZXIsIG9wdGlvbnMpKHJlcSwgcmVzKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0TG9naW5DYWxsYmFja0Z1bmN0aW9uKHByb3ZpZGVyKSB7XG4gIHJldHVybiAocmVxLCByZXMpID0+IHtcbiAgICBpZiAocmVxLnF1ZXJ5ICYmIHJlcS5xdWVyeS5zdGF0ZSAmJiAhcmVxLnF1ZXJ5LmVycm9yICYmIHJlcS5zZXNzaW9uLnN0YXRlICE9PSByZXEucXVlcnkuc3RhdGUpXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmFwaVJlc3BvbnNlKHtlcnJvcjogeyduYW1lJzogJ2ludmFsaWRfc3RhdGUnLCAnbWVzc2FnZSc6ICdpbnZhbGlkIHN0YXRlJ319KTtcblxuICAgIHJldHVybiBwYXNzcG9ydC5hdXRoZW50aWNhdGUoXG4gICAgICBwcm92aWRlcixcbiAgICAgIChhdXRoZW50aWNhdGVFcnIsIHVzZXIpID0+IHtcbiAgICAgICAgaWYgKGF1dGhlbnRpY2F0ZUVycilcbiAgICAgICAgICByZXR1cm4gcmVzLmFwaVJlc3BvbnNlKHtlcnJvcjogYXV0aGVudGljYXRlRXJyfSk7XG5cbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgdmFyIGVycm9yTmFtZSA9IHJlcy5yZXEucXVlcnkuZXJyb3I7XG4gICAgICAgICAgdmFyIGVycm9yRGVzY3JpcHRpb24gPSByZXMucmVxLnF1ZXJ5LmVycm9yX2Rlc2NyaXB0aW9uO1xuXG4gICAgICAgICAgcmV0dXJuIHJlcy5zZW5kKHtlcnJvcjogeyduYW1lJzogZXJyb3JOYW1lLCAnbWVzc2FnZSc6IGVycm9yRGVzY3JpcHRpb259fSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVxLmxvZ2luKHVzZXIsIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAocmVxLnNlc3Npb24ucmVkaXJlY3RBZnRlckxvZ2luKSB7XG4gICAgICAgICAgICB2YXIgcmVkaXJlY3QgPSByZXEuc2Vzc2lvbi5yZWRpcmVjdEFmdGVyTG9naW47XG5cbiAgICAgICAgICAgIGRlbGV0ZSByZXEuc2Vzc2lvbi5yZWRpcmVjdEFmdGVyTG9naW47XG4gICAgICAgICAgICByZXR1cm4gcmVzLnJlZGlyZWN0KDMwMiwgcmVkaXJlY3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnJlZGlyZWN0KDMwMiwgJy8nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICkocmVxLCByZXMpO1xuICB9XG59XG5cbmlmIChjb25maWcuZnJhbmNlQ29ubmVjdCkge1xuICB2YXIgRnJhbmNlQ29ubmVjdFN0cmF0ZWd5ID0gcmVxdWlyZSgncGFzc3BvcnQtZnJhbmNlY29ubmVjdCcpLlN0cmF0ZWd5O1xuXG4gIHBhc3Nwb3J0LnVzZSgnZnJhbmNlLWNvbm5lY3QnLCBuZXcgRnJhbmNlQ29ubmVjdFN0cmF0ZWd5KFxuICAgIHtcbiAgICAgIC8vIGF1dGhvcml6YXRpb25VUkw6IGNvbmZpZy5mcmFuY2VDb25uZWN0Lm9hdXRoLmF1dGhvcml6YXRpb25VUkwsXG4gICAgICAvLyB0b2tlblVSTDogY29uZmlnLmZyYW5jZUNvbm5lY3Qub2F1dGgudG9rZW5VUkwsXG4gICAgICBjbGllbnRJRDogY29uZmlnLmZyYW5jZUNvbm5lY3Qub3BlbklEQ29ubmVjdFN0cmF0ZWd5UGFyYW1ldGVycy5jbGllbnRJRCxcbiAgICAgIGNsaWVudFNlY3JldDogY29uZmlnLmZyYW5jZUNvbm5lY3Qub3BlbklEQ29ubmVjdFN0cmF0ZWd5UGFyYW1ldGVycy5jbGllbnRTZWNyZXQsXG4gICAgICBjYWxsYmFja1VSTDogY29uZmlnLmZyYW5jZUNvbm5lY3Qub2F1dGguY2FsbGJhY2tVUkwsXG4gICAgICAvLyB1c2VySW5mb1VSTDogY29uZmlnLmZyYW5jZUNvbm5lY3Qub3BlbklEQ29ubmVjdFN0cmF0ZWd5UGFyYW1ldGVycy51c2VySW5mb1VSTCxcbiAgICAgIHNjb3BlOiBjb25maWcuZnJhbmNlQ29ubmVjdC5vYXV0aC5zY29wZXMsXG4gICAgICBhY3JWYWx1ZXM6IGNvbmZpZy5mcmFuY2VDb25uZWN0Lm9wZW5JRENvbm5lY3RTdHJhdGVneVBhcmFtZXRlcnMuYWNyX3ZhbHVlcyxcbiAgICB9LFxuICAgIChpc3MsIHN1YiwgcHJvZmlsZSwgYWNjZXNzVG9rZW4sIHJlZnJlc2hUb2tlbiwgZG9uZSkgPT4ge1xuICAgICAgdmFyIHVzZXIgPSB7XG4gICAgICAgIHN1YjogcHJvZmlsZS5fanNvbi5zdWIsXG4gICAgICAgIGZpcnN0TmFtZTogcHJvZmlsZS5fanNvbi5naXZlbl9uYW1lLFxuICAgICAgICBsYXN0TmFtZTogcHJvZmlsZS5fanNvbi5mYW1pbHlfbmFtZSxcbiAgICAgICAgZ2VuZGVyOiBwcm9maWxlLl9qc29uLmdlbmRlcixcbiAgICAgICAgYmlydGhkYXRlOiBwcm9maWxlLl9qc29uLmJpcnRoZGF0ZSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBkb25lKG51bGwsIHVzZXIpO1xuICAgIH1cbiAgKSk7XG5cbiAgZXhwb3J0cy5mcmFuY2VDb25uZWN0TG9naW4gPSBnZXRMb2dpbkZ1bmN0aW9uKCdmcmFuY2UtY29ubmVjdCcsIHtzY29wZTogY29uZmlnLmZyYW5jZUNvbm5lY3Qub2F1dGguc2NvcGV9KTtcblxuICBleHBvcnRzLmZyYW5jZUNvbm5lY3RDYWxsYmFjayA9IGdldExvZ2luQ2FsbGJhY2tGdW5jdGlvbignZnJhbmNlLWNvbm5lY3QnKTtcbn1cblxuaWYgKGNvbmZpZy5mYWNlYm9vaykge1xuICB2YXIgRmFjZWJvb2tTdHJhdGVneSA9IHJlcXVpcmUoJ3Bhc3Nwb3J0LWZhY2Vib29rJykuU3RyYXRlZ3k7XG5cbiAgcGFzc3BvcnQudXNlKG5ldyBGYWNlYm9va1N0cmF0ZWd5KFxuICAgIHtcbiAgICAgIGNsaWVudElEOiBjb25maWcuZmFjZWJvb2suY2xpZW50SUQsXG4gICAgICBjbGllbnRTZWNyZXQ6IGNvbmZpZy5mYWNlYm9vay5jbGllbnRTZWNyZXQsXG4gICAgICBjYWxsYmFja1VSTDogY29uZmlnLmZhY2Vib29rLmNhbGxiYWNrVVJMLFxuICAgICAgcHJvZmlsZUZpZWxkczogWydpZCcsICdiaXJ0aGRheScsICdlbWFpbCcsICdmaXJzdF9uYW1lJywgJ2dlbmRlcicsICdsYXN0X25hbWUnXSxcbiAgICB9LFxuICAgIChhY2Nlc3NUb2tlbiwgcmVmcmVzaFRva2VuLCBwcm9maWxlLCBjYikgPT4ge1xuICAgICAgdmFyIHVzZXIgPSB7XG4gICAgICAgIHN1YiA6ICdmYWNlYm9vazonICsgcHJvZmlsZS5pZCxcbiAgICAgICAgZmlyc3ROYW1lOiBwcm9maWxlLm5hbWUuZ2l2ZW5OYW1lLFxuICAgICAgICBsYXN0TmFtZTogcHJvZmlsZS5uYW1lLmZhbWlseU5hbWUsXG4gICAgICAgIGdlbmRlcjogcHJvZmlsZS5nZW5kZXIsXG4gICAgICAgIGJpcnRoZGF0ZTogcHJvZmlsZS5fanNvbi5iaXJ0aGRheSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBjYihudWxsLCB1c2VyKTtcbiAgICB9XG4gICkpO1xuXG4gIGV4cG9ydHMuZmFjZWJvb2tMb2dpbiA9IGdldExvZ2luRnVuY3Rpb24oJ2ZhY2Vib29rJywgeyBzY29wZTogWyAncHVibGljX3Byb2ZpbGUnLCAndXNlcl9iaXJ0aGRheScgXSB9KTtcblxuICBleHBvcnRzLmZhY2Vib29rQ2FsbGJhY2sgPSBnZXRMb2dpbkNhbGxiYWNrRnVuY3Rpb24oJ2ZhY2Vib29rJyk7XG59XG5cbmlmIChjb25maWcuZ29vZ2xlKSB7XG4gIHZhciBHb29nbGVTdHJhdGVneSA9IHJlcXVpcmUoJ3Bhc3Nwb3J0LWdvb2dsZS1vYXV0aDIwJykuU3RyYXRlZ3k7XG5cbiAgcGFzc3BvcnQudXNlKG5ldyBHb29nbGVTdHJhdGVneShcbiAgICB7XG4gICAgICBjbGllbnRJRDogY29uZmlnLmdvb2dsZS5jbGllbnRJRCxcbiAgICAgIGNsaWVudFNlY3JldDogY29uZmlnLmdvb2dsZS5jbGllbnRTZWNyZXQsXG4gICAgICBjYWxsYmFja1VSTDogY29uZmlnLmdvb2dsZS5jYWxsYmFja1VSTCxcbiAgICB9LFxuICAgIChhY2Nlc3NUb2tlbiwgcmVmcmVzaFRva2VuLCBwcm9maWxlLCBjYikgPT4ge1xuICAgICAgdmFyIHVzZXIgPSB7XG4gICAgICAgIHN1YiA6ICdnb29nbGU6JyArIHByb2ZpbGUuaWQsXG4gICAgICAgIGZpcnN0TmFtZTogcHJvZmlsZS5uYW1lLmdpdmVuTmFtZSxcbiAgICAgICAgbGFzdE5hbWU6IHByb2ZpbGUubmFtZS5mYW1pbHlOYW1lLFxuICAgICAgICBnZW5kZXI6IHByb2ZpbGUuZ2VuZGVyLFxuICAgICAgfTtcblxuICAgICAgaWYgKHByb2ZpbGUuX2pzb24uYmlydGhkYXkpXG4gICAgICAgIHVzZXIuYmlydGhkYXkgPSBwcm9maWxlLl9qc29uLmJpcnRoZGF5O1xuXG4gICAgICByZXR1cm4gY2IobnVsbCwgdXNlcik7XG4gICAgfVxuICApKTtcblxuICBleHBvcnRzLmdvb2dsZUxvZ2luID0gZ2V0TG9naW5GdW5jdGlvbignZ29vZ2xlJywgeyBzY29wZTogWyAncHJvZmlsZScgXSB9KTtcblxuICBleHBvcnRzLmdvb2dsZUNhbGxiYWNrID0gZ2V0TG9naW5DYWxsYmFja0Z1bmN0aW9uKCdnb29nbGUnKTtcbn1cblxudmFyIG9wdHMgPSB7fVxub3B0cy5qd3RGcm9tUmVxdWVzdCA9IEV4dHJhY3RKd3QuZnJvbUF1dGhIZWFkZXIoKTtcbi8vIHNlY3JldE9yS2V5IGlzIG5vdCByZWFsbHkgaW1wb3J0YW50IHNpbmNlIHdlIHdpbGwgc2V0IGl0IGR5bmFtaWNhbGx5IGFjY29yZGluZ1xuLy8gdG8gdGhlIFwiQ29jb3JpY28tQXBwLUlkXCIgSFRUUCBoZWFkZXIuIEJ1dCBpdCBzdGlsbCBoYXMgdG8gYmUgIT0gZmFsc2UuXG5vcHRzLnNlY3JldE9yS2V5ID0gJ3NlY3JldCc7XG5cbi8vIEp3dFN0cmF0ZWd5IHJlYWRzIHRoZSBKV1Qgc2VjcmV0IGZyb20gdGhlIG9wdGlvbiBvYmplY3QgYWJvdmUuIEJ1dFxuLy8gd2UgbmVlZCB0aGUgc2VjcmV0IHRvIGJlIHRoZSBvbmUgc2V0IGZvciB0aGUgY29ycmVzcG9uZGluZyBBcHAuXG4vLyBUaHVzLCB3ZSBvdmVycmlkZSB0aGUgSnd0U3RyYXRlZ3kucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSBtZXRob2QgaW4gb3JkZXIgdG8gc2V0XG4vLyB0aGUgc2VjcmV0IGFjY29yZGluZyB0byB0aGUgQXBwIGZvdW5kIHVzaW5nIHRoZSBcIkNvY29yaWNvLUFwcC1JZFwiIGhlYWRlci5cbnZhciBhdXRoZW50aWNhdGUgPSBKd3RTdHJhdGVneS5wcm90b3R5cGUuYXV0aGVudGljYXRlO1xuSnd0U3RyYXRlZ3kucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKHJlcSwgb3B0aW9ucykge1xuICB2YXIgdG9rZW4gPSB0aGlzLl9qd3RGcm9tUmVxdWVzdChyZXEpO1xuICBpZiAoIXRva2VuKSB7XG4gICAgcmV0dXJuIHRoaXMuZmFpbCgpO1xuICB9XG5cbiAgdmFyIGFwcElkID0gcmVxLmhlYWRlcnNbJ2NvY29yaWNvLWFwcC1pZCddO1xuXG4gIGlmICghYXBwSWQpIHtcbiAgICByZXR1cm4gdGhpcy5mYWlsKG5ldyBFcnJvcignTWlzc2luZyBDb2Nvcmljby1BcHAtSWQgaGVhZGVyJykpO1xuICB9XG5cbiAgcmV0dXJuIEFwcC5tb2RlbC5maW5kQnlJZChhcHBJZCkuZXhlYygoZXJyLCBhcHApID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gdGhpcy5mYWlsKGVycik7XG4gICAgfVxuXG4gICAgaWYgKCFhcHApIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwobmV3IEVycm9yKCdJbnZhbGlkIGFwcCBpZCcpKTtcbiAgICB9XG5cbiAgICB0aGlzLl92ZXJpZk9wdHMuaXNzdWVyID0gYXBwLmlkO1xuICAgIHRoaXMuX3NlY3JldE9yS2V5ID0gYXBwLnNlY3JldDtcblxuICAgIHJldHVybiBhdXRoZW50aWNhdGUuY2FsbCh0aGlzLCByZXEsIG9wdGlvbnMpO1xuICB9KTtcbn1cblxucGFzc3BvcnQudXNlKG5ldyBKd3RTdHJhdGVneShvcHRzLCBmdW5jdGlvbihqd3RfcGF5bG9hZCwgZG9uZSkge1xuICBpZiAoISFqd3RfcGF5bG9hZC5zdWIpIHtcbiAgICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2Uga25vdyBmb3Igc3VyZSB0aGUgc2VjcmV0IGFuZCB0aGUgaXNzdWVyIGFyZSBjb3JyZWN0LlxuICAgICAgICAvLyBTbyB3ZSBjYW4gc2FmZWx5IGFzc3VtZSB0aGF0IGp3dF9wYXlsb2FkLmlzcyBpcyB0aGUgcmlnaHQgQXBwIElEIGFuZFxuICAgICAgICAvLyB1c2UgaXQgdG8gbWFrZSBzdXJlIHRoZSBcInN1YlwiIGlzIHVuaXF1ZSBhY3Jvc3MgbXVsdGlwbGUgYXBwcy5cbiAgICBqd3RfcGF5bG9hZC5zdWIgPSBqd3RfcGF5bG9hZC5pc3MgKyAnOicgKyBqd3RfcGF5bG9hZC5zdWI7XG5cbiAgICByZXR1cm4gZG9uZShudWxsLCBqd3RfcGF5bG9hZCk7XG4gIH1cblxuICByZXR1cm4gZG9uZShudWxsLCBmYWxzZSk7XG59KSk7XG4iXX0=