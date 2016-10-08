var config = require('/opt/cocorico/api-web/config.json');

var request = require('superagent-promise')(require('superagent'), Promise);

var getAPIURL = require('./getAPIURL');

describe('/oauth/token', async () => {
  it('returns 401 when appId or secret is invalid', async () => {

    try {
      const res = await request
        .post(getAPIURL('/oauth/token'))
        .send({'grant_type': 'client_credentials'})
        .set('Authorization', 'Basic ' + new Buffer('424242424242424242424242:foo').toString('base64'));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('returns 500 when appId is not a valid MongoDB ObjectID', async () => {
    try {
      const res = await request
        .post(getAPIURL('/oauth/token'))
        .send({'grant_type': 'client_credentials'})
        .set('Authorization', 'Basic ' + new Buffer('foo:bar').toString('base64'));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(500);
    }
  });

  it('returns 200 when appId and secret are valid', async () => {
    var appId = config.testApp.id;
    var appSecret = config.testApp.secret;

    const res = await request
      .post(getAPIURL('/oauth/token'))
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'));

    expect(res.status).toBe(200);
  });

  it('returns an auth_token when appId and secret are valid', async () => {
    var appId = config.testApp.id;
    var appSecret = config.testApp.secret;

    const res = await request
      .post(getAPIURL('/oauth/token'))
      .send({'grant_type': 'client_credentials'})
      .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'));

    expect('access_token' in res.body).toBe(true);
    expect(res.body.access_token).not.toBe('');
  });
});
