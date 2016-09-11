var oauth2orize = require('oauth2orize');
var uid = require('uid');
var crypto = require('crypto');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var keystone = require('keystone');

var App = keystone.list('App'),
    AccessToken = keystone.list('AccessToken');

var server = oauth2orize.createServer();

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
    var token = uid(256);
    var tokenHash = crypto.createHash('sha1').update(token).digest('hex');
    var expiresIn = 1800;
    var expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));

    var accessToken = AccessToken.model({
        token: tokenHash,
        expirationDate: expirationDate,
        client: client.id,
        scope: scope
    });

    accessToken.save((err, accessToken) => {
        if (err) {
            return done(err);
        }

        return done(null, token, {expires_in: expiresIn});
    });
}));

passport.use("clientBasic", new BasicStrategy((clientId, clientSecret, done) => {
    App.model.findById(clientId).exec((err, app) => {
        if (err) {
            return done(err);
        }
        if (!app) {
            return done(null, false);
        }

        if (clientSecret == app.secret) {
            return done(null, app ? app : false);
        }
    });
}));

passport.use("clientPassword", new ClientPasswordStrategy((clientId, clientSecret, done) => {
    App.model.findById(clientId).exec((err, app) => {
        if (err) {
            return done(err);
        }
        if (!app) {
            return done(null, false);
        }

        if (app.secret == clientSecret) {
            return done(null, app);
        } else {
            return done(null, false);
        }
    });
}));

/**
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).
 */
passport.use("accessToken", new BearerStrategy((accessToken, done) => {
    var accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex');

    AccessToken.model.findOne({token: accessTokenHash}, (err, token) => {
        if (err) {
            return done(err);
        }
        if (!token) {
            return done(null, false);
        }
        if (new Date() > token.expirationDate) {
            token.remove((err) => done(err));
        } else {
            App.model.findById(token.client).exec((err, app) => {
                if (err) {
                    return done(err);
                }
                if (!app) {
                    return done(null, false);
                }
                // no use of scopes for now
                var info = { scope: '*' };

                return done(null, app, info);
            });
        }
    })
}));

exports.checkAccessToken = function(req, res, next) {
    passport.authenticate('accessToken', { session: false })(req, res, next);
}

exports.token = [
    passport.authenticate(['clientBasic', 'clientPassword'], { session: false }),
    server.token(),
    server.errorHandler()
]
