var config = require('/opt/cocorico/api-web/config.json');

import request from './getRequest';
import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import getVote from './getVote';
import updateVote from './updateVote';
import sendBallot from './sendBallot';

const url = 'https://localhost/';

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
    expect(res.body.vote.secret).toBeFalsy();
  });

  it('has a valid smart contract address and ABI', async () => {
    try {
      const vote = await getVote(true);

      expect(vote.voteContractABI).not.toBeFalsy();
      expect(vote.voteContractAddress).not.toBeFalsy();
    } catch (err) {
      console.log(err);
    }
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

describe('GET /vote/result/:voteId', () => {
  it ('returns 403 if Vote.status is not "complete"', async () => {
    const vote = await getVote(true);

    try {
      const res = await request
        .get(getAPIURL('/vote/result/' + vote.id));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
    }
  });

  it ('returns 200 if Vote.status is "complete"', async () => {
    const vote = await getVote(true);
    await updateVote(vote, {status: 'complete'});

    const res = await request
      .get(getAPIURL('/vote/result/' + vote.id));

    expect(res.status).toBe(200);
  });

  it ('returns 200 and the results', async () => {
    console.log('test');
    try {
      const vote = await getVote(true);
      expect(vote).not.toBeFalsy();
    } catch (err) {
      console.log(err);
    }

    // console.log(vote);
    // const ballots = [
    //   await sendBallot(vote, 0),
    //   await sendBallot(vote, 1),
    //   await sendBallot(vote, 1),
    //   await sendBallot(vote, 1),
    //   await sendBallot(vote, 2),
    //   await sendBallot(vote, 2),
    // ];
    //
    // console.log(ballots);
    //
    // await updateVote(vote, {status: 'complete'});
    //
    // const res = await request
    //   .get(getAPIURL('/vote/result/' + vote.id));
    //
    // expect(res.status).toBe(200);
    // console.log(res.body);
  });
});
