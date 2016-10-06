var request = require('superagent-promise')(require('superagent'), Promise);

var getAccessToken = require('./getAccessToken');

describe('/vote/:voteId', () => {
  it('returns 404 when :voteId is invalid', async () => {
    try {
      const res = await request.get('https://local.cocorico.cc/api/vote/424242424242424242424242');
      expect(res).toBe(null);
    } catch (err) {
      expect(err.status).toBe(404);
    }
  });

  it('returns an empty response when :voteId is invalid', async () => {
    try {
      const res = await request.get('https://local.cocorico.cc/api/vote/424242424242424242424242');
      expect(res).toBe(null);
    } catch (err) {
      expect(err.response.body).toEqual({});
    }
  });

});

describe('POST /vote', () => {
  it('returns 401 when the access token is missing', async () => {
    try {
      const res = await request
        .post('https://localhost/api/vote');

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('returns 400 when the URL is missing', async () => {
    const accesToken = await getAccessToken();

    try {
      const res = await request
        .post('https://localhost/api/vote')
        .set('Authorization', 'Bearer ' + accesToken);

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('returns 403 when the URL doesn\'t match with App.validURLs', async () => {
    const accesToken = await getAccessToken();

    try {
      const res = await request
        .post('https://localhost/api/vote')
        .set('Authorization', 'Bearer ' + accesToken)
        .send({'url': 'https://127.0.0.1/about'});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
    }
  });

  it('returns 200 and a vote object when the URL is valid', async () => {
    const accesToken = await getAccessToken();

    const res = await request
      .post('https://localhost/api/vote')
      .set('Authorization', 'Bearer ' + accesToken)
      .send({'url': 'https://localhost/about'});

    expect(res.status).toBe(200);
  });

  it('returns 400 when a vote with the same URL exists', async () => {
    const accesToken = await getAccessToken();

    try {
      const res = await request
        .post('https://localhost/api/vote')
        .set('Authorization', 'Bearer ' + accesToken)
        .send({'url': 'https://localhost/about'});

      expect(res).toBeFalsy();
    } catch (err) {
      // console.log(err);
      expect(err.status).toBe(400);
    }
  });
});
