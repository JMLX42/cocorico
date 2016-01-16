var passport = require('passport');
var keystone = require('keystone');
var bcrypt = require('bcrypt');
var User = keystone.list('User');
var OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
var passportAuthenticateWithCUstomClaims = require('../../helpers/PassportAuthenticateWithCustomClaims').PassportAuthenticateWithCustomClaims;

var config = require('/opt/cocorico/cocorico.json');

passport.serializeUser(function(user, done)
{
    done(null, user);
});

passport.deserializeUser(function(user, done)
{
    done(null, user);
});

var strat = function() {
    var strategy = new OpenIDConnectStrategy(
        {
            authorizationURL: config.franceConnect.oauth.authorizationURL,
            tokenURL: config.franceConnect.oauth.tokenURL,
            clientID: config.franceConnect.openIDConnectStrategyParameters.clientID,
            clientSecret: config.franceConnect.openIDConnectStrategyParameters.clientSecret,
            callbackURL: config.franceConnect.oauth.callbackURL,
            userInfoURL: config.franceConnect.openIDConnectStrategyParameters.userInfoURL,
            scope: config.franceConnect.oauth.scopes
        },
        function (iss, sub, profile, accessToken, refreshToken, done)
        {
            done(null, profile);
        });

    var alternateAuthenticate = new passportAuthenticateWithCUstomClaims(
        config.franceConnect.openIDConnectStrategyParameters.userInfoURL,
        config.franceConnect.openIDConnectStrategyParameters.acr_values,
        1
    );
    strategy.authenticate = alternateAuthenticate.authenticate;

    return strategy;
};

passport.use('provider', strat());

exports.login = function(req, res)
{
    console.log('redirect', req.query.redirect);
    if (req.query.redirect)
        req.session.redirectAfterLogin = req.query.redirect;

    passport.authenticate(
        'provider',
        {
            scope: config.franceConnect.oauth.scope
        }
    )(req, res);
}

exports.logout = function(req, res)
{
    req.logout();

    return res.redirect(302, '/');
}

exports.fakeLogin = function(req, res)
{
    user = {
        sub: '1234567890',
        firstName: 'Fake',
        lastName: 'User',
        gender: 'male',
        birthdate: '1970-01-01'
    };

    req.login(user, function(err) {
        return res.apiResponse(user);
    });
}

exports.connectCallback = function(req, res, next)
{
    if (req.query && req.query.state && !req.query.error && req.session.state !== req.query.state)
        return res.status(404).apiResponse({error: {'name': 'invalid_state', 'message': 'invalid state'}});

    passport.authenticate(
        'provider',
        function(err, user)
        {
            if (err)
                return res.apiResponse({error: err});

            if (!user)
            {
                var errorName = res.req.query.error;
                var errorDescription = res.req.query.error_description;

                return res.send({error: {'name': errorName, 'message': errorDescription}});
            }

            user = {
                sub: user._json.sub,
                firstName: user._json.given_name,
                lastName: user._json.family_name,
                gender: user._json.gender,
                birthdate: user._json.birthdate
            };

            req.login(user, function(err) {
                // if (err)
                // {
                //     req.logout();
                //
                //     return res.redirect(302, '/');
                // }

                if (req.session.redirectAfterLogin)
                {
                    var redirect = req.session.redirectAfterLogin;

                    delete req.session.redirectAfterLogin;
                    return res.redirect(302, redirect);
                }
                else
                {
                    return res.redirect(302, '/');
                }
            });
        }
    )(req, res);
}
