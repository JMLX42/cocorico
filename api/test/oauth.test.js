var config = require('/opt/cocorico/api-web/config.json');

var Promise = this.Promise || require('promise');
var request = require('superagent-promise')(require('superagent'), Promise);

describe('/oauth/token', () => {
  it('returns 401 when appId or secret is invalid', () => {
    return request
      .post('https://127.0.0.1/api/oauth/token')
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer('424242424242424242424242:foo').toString('base64'))
      .then(
        (res) => null,
        (err) => expect(err.status).toBe(401)
      )
  });

  it('returns 500 when appId is not a valid MongoDB ObjectID', () => {
    return request
      .post('https://127.0.0.1/api/oauth/token')
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer('foo:bar').toString('base64'))
      .then(
        (res) => null,
        (err) => expect(err.status).toBe(500)
      )
  });

  it('returns 200 when appId and secret are valid', () => {
    var appId = config.testApp.id;
    var appSecret = config.testApp.secret;

    return request
      .post('https://127.0.0.1/api/oauth/token')
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'))
      .then(
        (res) => expect(res.status).toBe(200),
        (err) => expect(!!err).toBe(false)
      )
  });

  it('returns an auth_token when appId and secret are valid', () => {
    var appId = config.testApp.id;
    var appSecret = config.testApp.secret;

    return request
      .post('https://127.0.0.1/api/oauth/token')
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'))
      .then(
        (res) => {
          expect('access_token' in res.body).toBe(true);
          expect(res.body.access_token).not.toBe('');
        },
        (err) => expect(!!err).toBe(false)
      )
  });
});
