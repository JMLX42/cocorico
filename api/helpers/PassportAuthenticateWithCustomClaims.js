var url = require('url');
var querystring = require('querystring');
var _ = require('lodash');
var OAuth2 = require('oauth').OAuth2;
var crypto = require('crypto');
var _userInfoURLBase = '';

var _acr_values = null;

var PassportAuthenticateWithCustomClaims = function(userInfoUrl, acrValues){
    _userInfoURLBase = userInfoUrl;
    _acr_values = acrValues;
};

PassportAuthenticateWithCustomClaims.prototype.authenticate = function(req, options) {
    options = options || {};
    var self = this;
    if (req.query && req.query.error) {
        console.error('error when initiating authentication with FI : '+ (req.query.error ? req.query.error : ''));
        return this.fail({redirect_uri: options.failureRedirect});
    }

    var callbackURL = options.callbackURL || this._callbackURL;
    if (callbackURL) {
        var parsed = url.parse(callbackURL);
        if (!parsed.protocol) {
            // The callback URL is relative, resolve a fully qualified URL from the
            // URL of the originating request.
            callbackURL = url.resolve(utils.originalURL(req), callbackURL);
        }
    }

    if (req.query && req.query.code) {
        var code = req.query.code;
        var oauth2 = new OAuth2(this._clientID,  this._clientSecret,'', this._authorizationURL, this._tokenURL);

        oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code', redirect_uri: callbackURL }, function(err, accessToken, refreshToken, params) {
            if (err) {
                console.error('error when getting access token with FC ' + self._tokenURL);
                console.error(err.stack);
                return self.fail({redirect_uri: options.failureRedirect});
            }
            var idToken = params['id_token'];
            if (!idToken) {
                console.error('ID Token not present in token response from FI ' + req.headers.referer);
                return self.fail({redirect_uri: options.failureRedirect});
            }

            //store idToken in session for testing purpose
            req.session.idToken = idToken;

            var idTokenSegments = idToken.split('.')
                , jwtClaimsStr
                , jwtClaims;

            // TODO: Try catch this to trap JSON parse errors.
            try {
                jwtClaimsStr = new Buffer(idTokenSegments[1], 'base64').toString();
                jwtClaims = JSON.parse(jwtClaimsStr);
            } catch (ex) {
                console.error('error parsing jwt from FI '+req.headers.referer + ': ' + ex);
                return self.fail({redirect_uri: options.failureRedirect});
            }

            var expectedIssuerHostname = url.parse(self._tokenURL).hostname;
            if ((jwtClaims === undefined || jwtClaims.iss === undefined) || expectedIssuerHostname !== url.parse(jwtClaims.iss).hostname) {
                console.error('idToken provided does not contain the valid issuer host name : should be ' + expectedIssuerHostname + ' instead of ' + jwtClaims.iss);
                return self.fail({redirect_uri: options.failureRedirect});
            }

            if (jwtClaims.nonce && (jwtClaims.nonce !== req.session.nonce)) {
                console.error('idToken provided does not contain the valid nonce value');
                return self.fail({redirect_uri: options.failureRedirect});
            }

            var iss = jwtClaims.iss;
            var sub = jwtClaims.sub;

            self._shouldLoadUserProfile(iss, sub, function(err, load) {
                if (err) {
                    console.error('error loading user profile : '+err);
                    return self.fail({redirect_uri: options.failureRedirect});
                }

                if (load) {
                    var parsed = url.parse(self._userInfoURL, true);
                    parsed.query['schema'] = 'openid';
                    delete parsed.search;
                    var userInfoURL = _userInfoURLBase+'?schema=openid';
                    oauth2._request("GET", userInfoURL, {
                        'Accept': "application/json",
                        'Authorization': 'Bearer '+accessToken
                    }, null, null, function (err, body) {
                        if (err) {
                            console.error('error when accessing userInfo with FI '+req.headers.referer+' : '+err);
                            return self.fail({redirect_uri: options.failureRedirect});
                        }

                        var json;
                        var profile = {};
                        try {
                            json = JSON.parse(body);
                            json.sub = json.sub.toString();

                            profile.id = json.sub;
                            // Prior to OpenID Connect Basic Client Profile 1.0 - draft 22, the
                            // "sub" key was named "user_id".  Many providers still use the old
                            // key, so fallback to that.
                            if (!profile.id) {
                                profile.id = json.user_id;
                            }

                            profile.displayName = json.name;
                            profile.name = { familyName: json.family_name,
                                givenName: json.given_name,
                                middleName: json.middle_name };

                            profile._raw = body;

                            profile._json = json;
                        }
                        catch (e) {
                            console.error('error parsing id token from FI '+req.headers.referer+': '+e);
                            return self.fail({redirect_uri: options.failureRedirect});
                        }

                        //TODO : tests, gros changements par rapport à la strat custom FC
                        onProfileLoaded(profile);
                    });
                } else {
                    onProfileLoaded();
                }

                function onProfileLoaded(profile) {
                    function verified(err, user, info) {
                        if (err) {
                            console.error('error in method verified: ' + err);
                            return self.fail({redirect_uri: options.failureRedirect});
                        }
                        if (!user) {
                            return self.fail(info);
                        }
                        self.success(user, info);
                    }
                    var arity = null;
                    if (self._passReqToCallback) {
                        arity = self._verify.length;
                        if (arity == 9) {
                            self._verify(req, iss, sub, profile, jwtClaims, accessToken, refreshToken, params, verified);
                        } else if (arity == 8) {
                            self._verify(req, iss, sub, profile, accessToken, refreshToken, params, verified);
                        } else if (arity == 7) {
                            self._verify(req, iss, sub, profile, accessToken, refreshToken, verified);
                        } else if (arity == 5) {
                            self._verify(req, iss, sub, profile, verified);
                        } else { // arity == 4
                            self._verify(req, iss, sub, verified);
                        }
                    } else {
                        arity = self._verify.length;
                        if (arity == 8) {
                            self._verify(iss, sub, profile, jwtClaims, accessToken, refreshToken, params, verified);
                        } else if (arity == 7) {
                            self._verify(iss, sub, profile, accessToken, refreshToken, params, verified);
                        } else if (arity == 6) {
                            self._verify(iss, sub, profile, accessToken, refreshToken, verified);
                        } else if (arity == 4) {
                            self._verify(iss, sub, profile, verified);
                        } else { // arity == 3
                            self._verify(iss, sub, verified);
                        }
                    }
                }
            });
        });
    } else {
        //var params = this.authorizationParams(options);
        var params = {};
        params['response_type'] = 'code';
        params['client_id'] = this._clientID;
        params['redirect_uri'] = callbackURL;
        var scope = options.scope || this._scope;
        if (Array.isArray(scope)) {
            scope = scope.join(this._scopeSeparator);
        }

        // ajout demande des champs facultatifs
        //params.scope = params.scope + this._scopeSeparator + 'email' + this._scopeSeparator + 'address' + this._scopeSeparator + 'phone' + this._scopeSeparator + 'preferred_username';
        params.state = req.session.state = options.state || crypto.randomBytes(25).toString('hex');
        params.nonce = req.session.nonce = options.nonce || crypto.randomBytes(25).toString('hex');

        // TODO: Implement support for standard OpenID Connect params (display, prompt, etc.)
        params.acr_values = _acr_values;

        if(options.consents){
            params.consents = options.consents;
        }

        params.scope = scope;

        var location = this._authorizationURL + '?' + querystring.stringify(params);
        this.redirect(location);
    }
};

module.exports.PassportAuthenticateWithCustomClaims = PassportAuthenticateWithCustomClaims;
