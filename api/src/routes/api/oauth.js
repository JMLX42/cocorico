import oauth2orize from 'oauth2orize';
import uid from 'uid';
import crypto from 'crypto';
import passport from 'passport';
import {BasicStrategy} from 'passport-http';
import {Strategy as ClientPasswordStrategy} from 'passport-oauth2-client-password';
import {Strategy as BearerStrategy} from 'passport-http-bearer';
import keystone from 'keystone';

const App = keystone.list('App'),
  AccessToken = keystone.list('AccessToken');

const server = oauth2orize.createServer();

server.exchange(oauth2orize.exchange.clientCredentials(async (client, scope, done) => {
  const token = uid(256);
  const tokenHash = crypto.createHash('sha1').update(token).digest('hex');
  const expiresIn = 1800;
  const expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
  const accessToken = AccessToken.model({
    token: tokenHash,
    expirationDate: expirationDate,
    client: client.id,
    scope: scope,
  });

  try {
    await accessToken.save();

    return done(null, token, {expires_in: expiresIn});
  } catch (saveAccessTokenErr) {
    return done(saveAccessTokenErr);
  }
}));

passport.use('clientBasic', new BasicStrategy(async (clientId, clientSecret, done) => {
  try {
    const app = await App.model.findById(clientId).exec();

    if (!app) {
      return done(null, false);
    }

    if (clientSecret === app.secret) {
      return done(null, app);
    }

    return done(null, false);
  } catch (findAppErr) {
    return done(findAppErr);
  }
}));

passport.use('clientPassword', new ClientPasswordStrategy((clientId, clientSecret, done) => {
  App.model.findById(clientId).exec((err, app) => {
    if (err) {
      return done(err);
    }
    if (!app) {
      return done(null, false);
    }

    if (app.secret === clientSecret) {
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
passport.use('accessToken', new BearerStrategy(async (accessToken, done) => {
  const accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex');

  try {
    const token = await AccessToken.model.findOne({token: accessTokenHash}).exec();

    if (!token) {
      return done(null, false);
    }

    if (new Date() > token.expirationDate) {
      return token.remove((removeErr) => done(removeErr));
    } else {
      try {
        const app = await App.model.findById(token.client).exec();

        if (!app) {
          return done(null, false);
        }
        // no use of scopes for now
        const info = { scope: '*' };

        return done(null, app, info);
      } catch (findAppErr) {
        return done(findAppErr);
      }
    }
  } catch (findErr) {
    return done(findErr);
  }
}));

export function checkAccessToken(req, res, next) {
  passport.authenticate('accessToken', { session: false })(req, res, next);
}

export const token = [
  passport.authenticate(['clientBasic', 'clientPassword'], { session: false }),
  server.token(),
  server.errorHandler(),
]
