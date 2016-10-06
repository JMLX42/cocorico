var config = require('/opt/cocorico/api-web/config.json');

var request = require('superagent-promise')(require('superagent'), Promise);
var jwt = require('jsonwebtoken');

describe('/user/me', async () => {
  it('returns 401 when not signed in', async () => {
    try {
      const res = await request.get('https://127.0.0.1/api/user/me');

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('returns a 401 and an error message when the JWT secret/signature is not valid', async () => {
    var token = jwt.sign({ foo: 'bar' }, 'foo');

    try {
      const res = await request
        .get('https://127.0.0.1/api/user/me')
        .set('Authorization', 'JWT ' + token)
        .set('Cocorico-App-Id', config.testApp.id);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.response.body.error).toBe('authentication failed');
      expect(err.response.body.message).toBe('invalid signature');
      expect(err.status).toBe(401);
    }
  });

  it('returns a 401 and an error message when the app ID is missing', async () => {
    var token = jwt.sign({ foo: 'bar' }, config.testApp.secret);

    try {
      const res = await request
        .get('https://127.0.0.1/api/user/me')
        .set('Authorization', 'JWT ' + token);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.response.body.error).toBe('authentication failed');
      expect(err.response.body.message).toBe('Missing Cocorico-App-Id header');
      expect(err.status).toBe(401);
    }
  });

  it('returns a 401 and an error message when the JWT issuer is not valid', async () => {
    var token = jwt.sign({ foo: 'bar' }, config.testApp.secret);

    try {
      const res = await request
        .get('https://127.0.0.1/api/user/me')
        .set('Authorization', 'JWT ' + token)
        .set('Cocorico-App-Id', config.testApp.id);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.response.body.error).toBe('authentication failed');
      expect(err.response.body.message).toBe('jwt issuer invalid. expected: ' + config.testApp.id);
      expect(err.status).toBe(401);
    }
  });

  it('returns a 401 and an error message when the JWT has no "sub" field', async () => {
    var token = jwt.sign(
      {
        iss: config.testApp.id,
        foo: 'bar',
      },
      config.testApp.secret
    );

    try {
      const res = await request
        .get('https://127.0.0.1/api/user/me')
        .set('Authorization', 'JWT ' + token)
        .set('Cocorico-App-Id', config.testApp.id);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.response.body.error).toBe('not authenticated');
      expect(err.status).toBe(401);
    }
  });

  it('returns 200 and the user object when the JWT is valid', async () => {
    var sub = '1234567890';
    var token = jwt.sign(
      {
        iss: config.testApp.id,
        sub: sub,
        foo: 'bar',
      },
      config.testApp.secret
    );

    const res = await request
      .get('https://127.0.0.1/api/user/me')
      .set('Authorization', 'JWT ' + token)
      .set('Cocorico-App-Id', config.testApp.id);

    expect(res.body.user.foo).toBe('bar');
    expect(res.body.user.sub).toBe(config.testApp.id + ':' + sub);
  });

  it('returns 200 and the user object when the JWT has a valid expiration date', async () => {
    var sub = '1234567890';
    var token = jwt.sign(
      {
        iss: config.testApp.id,
        exp: Date.now() / 1000 + 100,
        sub: sub,
        foo: 'bar',
      },
      config.testApp.secret
    );

    const res = await request
      .get('https://127.0.0.1/api/user/me')
      .set('Authorization', 'JWT ' + token)
      .set('Cocorico-App-Id', config.testApp.id);

    expect(res.body.user.foo).toBe('bar');
    expect(res.body.user.sub).toBe(config.testApp.id + ':' + sub);
  });

  it('returns 401 and an error message when the JWT has expired', async () => {
    var sub = '1234567890';
    var token = jwt.sign(
      {
        iss: config.testApp.id,
        exp: Date.now() / 1000 - 100,
        sub: sub,
        foo: 'bar',
      },
      config.testApp.secret
    );

    try {
      const res = await request
        .get('https://127.0.0.1/api/user/me')
        .set('Authorization', 'JWT ' + token)
        .set('Cocorico-App-Id', config.testApp.id);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.response.body.error).toBe('authentication failed');
      expect(err.response.body.message).toBe('jwt expired');
      expect(err.status).toBe(401);
    }
  });
});
