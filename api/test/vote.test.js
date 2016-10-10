var config = require('/opt/cocorico/api-web/config.json');

var request = require('superagent-promise')(require('superagent'), Promise);
var delay = require('timeout-as-promise');

var getAccessToken = require('./getAccessToken');
var getAPIURL = require('./getAPIURL');

const url = 'https://www.meetup.com';

describe('/vote/:voteId', () => {
  it('returns 404 and an empty response when :voteId is invalid', async () => {
    try {
      const res = await request.get(getAPIURL('/vote/424242424242424242424242'));
      expect(res).toBe(null);
    } catch (err) {
      expect(err.status).toBe(404);
      expect(err.response.body).toEqual({});
    }
  });
});

describe('POST /vote', () => {
  it('returns 401 when the access token is missing', async () => {
    try {
      const res = await request
        .post(getAPIURL('/vote'));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('returns 400 when the URL is missing', async () => {
    const accesToken = await getAccessToken();

    try {
      const res = await request
        .post(getAPIURL('/vote'))
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
        .post(getAPIURL('/vote'))
        .set('Authorization', 'Bearer ' + accesToken)
        .send({'url': 'http://localhost'});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
    }
  });

  it('returns 200 and a vote object when the URL is valid', async () => {
    const accesToken = await getAccessToken();
    const res = await request
      .post(getAPIURL('/vote'))
      .set('Authorization', 'Bearer ' + accesToken)
      .send({'url': url});

    expect(res.status).toBe(200);
    expect(res.body.vote).not.toBeFalsy();
    expect(res.body.vote.createdAt).not.toBeFalsy();
    expect(res.body.vote.updatedAt).not.toBeFalsy();
    expect(res.body.vote.numBallots).toBe(0);
    expect(res.body.vote.numValidBallots).toBe(0);
    expect(res.body.vote.numInvalidBallots).toBe(0);
    expect(res.body.vote.app).toBe(config.testApp.id);
    expect(res.body.vote.url).toBe(url);
    expect(res.body.vote.status).toBe('initializing');
  });

  it('has a valid smart contract address and ABI', async () => {
    await delay(10000);

    const voteId = await request
      .get(getAPIURL('/vote'))
      .then((res) => res.body.votes.slice(-1)[0].id);
    const res = await request.get(getAPIURL('/vote/'+ voteId));

    expect(res.body.vote.voteContractABI).not.toBeFalsy();
    expect(res.body.vote.voteContractAddress).not.toBeFalsy();
  });

  it('returns 400 when a vote with the same URL exists', async () => {
    const accesToken = await getAccessToken();

    try {
      const res = await request
        .post(getAPIURL('/vote'))
        .set('Authorization', 'Bearer ' + accesToken)
        .send({'url': url});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

describe('PUT /vote/:voteId', () => {
  it('returns 200 and a modified vote object when we edit the title', async () => {
    const accesToken = await getAccessToken();
    const voteId = await request
      .get(getAPIURL('/vote'))
      .then((res) => res.body.votes[res.body.votes.length - 1].id);
    const res = await request
      .put(getAPIURL('/vote/') + voteId)
      .set('Authorization', 'Bearer ' + accesToken)
      .send({'title': 'edited title'});

    expect(res.status).toBe(200);
    expect(res.body.vote.title).toBe('edited title');
  });

  it('returns 200 and a modified vote object when we edit the description', async () => {
    const accesToken = await getAccessToken();
    const voteId = await request
      .get(getAPIURL('/vote'))
      .then((res) => res.body.votes[res.body.votes.length - 1].id);
    const res = await request
      .put(getAPIURL('/vote/') + voteId)
      .set('Authorization', 'Bearer ' + accesToken)
      .send({'description': 'edited description'});

    expect(res.status).toBe(200);
    expect(res.body.vote.description).toBe('edited description');
  });

  it('returns 200 and a modified vote object when we edit the image', async () => {
    const accesToken = await getAccessToken();
    const voteId = await request
      .get(getAPIURL('/vote'))
      .then((res) => res.body.votes[res.body.votes.length - 1].id);
    const res = await request
      .put(getAPIURL('/vote/') + voteId)
      .set('Authorization', 'Bearer ' + accesToken)
      .send({'image': getAPIURL('/img.jpg')});

    expect(res.status).toBe(200);
    expect(res.body.vote.image).toBe(getAPIURL('/img.jpg'));
  });
});
