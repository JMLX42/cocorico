var passport = require('passport');
var keystone = require('keystone');
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
            scope: config.franceConnect.oauth.scopes,
            skipUserProfile: true
        },
        function (iss, sub, profile, accessToken, refreshToken, done) {
            profile = {};
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            done(null, profile);
        });

    var alternateAuthenticate = new passportAuthenticateWithCUstomClaims(
        '', config.franceConnect.openIDConnectStrategyParameters.acr_values, 1
    );
    strategy.authenticate = alternateAuthenticate.authenticate;
    
    return strategy;
};

passport.use('provider', strat());

exports.login = passport.authenticate(
    'provider',
    {
        successRedirect: '/api/user/authSuccess',
        failureRedirect: '/api/user/authFail',
        scope: config.franceConnect.oauth.scopes
    }
);

exports.success = function(req, res)
{
    console.log('success');
}

exports.fail = function(req, res)
{
    console.log('fail');
}
