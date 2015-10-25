var passport = require('passport');
var keystone = require('keystone');
var bcrypt = require('bcrypt');
var User = keystone.list('User');
var OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
var passportAuthenticateWithCUstomClaims = require('../../helpers/PassportAuthenticateWithCustomClaims').PassportAuthenticateWithCustomClaims;

var config = require('../../config/config.json');

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

exports.login = passport.authenticate(
    'provider',
    {
        scope: config.franceConnect.oauth.scope
    }
);

exports.logout = function(req, res)
{
    req.logout();

    return res.redirect(302, '/');
}

exports.connectCallback = function(req, res, next)
{
    if (req.query && req.query.state && !req.query.error && req.session.state !== req.query.state)
        return res.status(404).apiResponse({error: {'name': 'invalid_state', 'message': 'invalid state'}});

    // console.log(req.query.state);

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

            console.log(user);

            req.login(user, function(err) {
                return res.redirect(302, '/');
            });
        }
    )(req, res);
}
