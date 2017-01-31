import config from '/opt/cocorico/api-web/config.json';

import {
  request,
  getAccessToken,
  getAPIURL,
  createVote,
  getVote,
  updateVote,
  sendBallot
} from 'cocorico-test';

const url = config.testApp.url;

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
      const res = await request.post(getAPIURL('/vote'));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('returns 400 when the URL is missing', async () => {
    try {
      const res = await createVote(false, {url: ''});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('returns 403 when the URL doesn\'t match with App.validURLs', async () => {
    try {
      const res = await createVote(false, {'url': 'http://invalid.url.test'});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
    }
  });

  it('returns a vote object when the URL is valid', async () => {
    const vote = await createVote(false, {'url': url});

    expect(vote).not.toBeFalsy();
    expect(vote.createdAt).not.toBeFalsy();
    expect(vote.updatedAt).not.toBeFalsy();
    expect(vote.numBallots).toBe(0);
    expect(vote.numValidBallots).toBe(0);
    expect(vote.numInvalidBallots).toBe(0);
    expect(vote.app).toBe(config.testApp.id);
    expect(vote.url).toBe(url);
    expect(vote.status).toBe('initializing');
    expect(vote.secret).toBeFalsy();
  });

  it('has a valid smart contract address and ABI', async () => {
    try {
      const vote = await createVote(true);

      expect(vote.voteContractABI).not.toBeFalsy();
      expect(vote.voteContractAddress).not.toBeFalsy();
    } catch (err) {
      console.log(err);
    }
  });

  it('returns 400 when a vote with the same URL exists', async () => {
    try {
      const vote = await createVote(false);
      const res = await createVote(false, {'url': vote.url});

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

describe('PUT /vote/:voteId', () => {
  it('returns a modified vote object when we edit the title', async () => {
    const vote = await createVote(false);
    const updatedVote = await updateVote(vote, {'title': 'edited title'});

    expect(updatedVote.title).toBe('edited title');
  });

  it('returns a modified vote object when we edit the description', async () => {
    const vote = await createVote(false);
    const updatedVote = await updateVote(vote, {'description': 'edited description'});

    expect(updatedVote.description).toBe('edited description');
  });

  it('returns a modified vote object when we edit the image', async () => {
    const vote = await createVote(false);
    const updatedVote = await updateVote(vote, {'image': getAPIURL('/img.jpg')});

    expect(updatedVote.image).toBe(getAPIURL('/img.jpg'));
  });
});

describe('GET /vote/result/:voteId', () => {
  it ('returns 403 if Vote.status is not "complete"', async () => {
    const vote = await createVote(true);

    try {
      const res = await request
        .get(getAPIURL('/vote/result/' + vote.id));

      expect(res).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
    }
  });

  it ('returns 200 if Vote.status is "complete"', async () => {
    const vote = await createVote(true);
    const updatedVote = await updateVote(vote, {status: 'complete'});

    console.log(updatedVote);

    const res = await request
      .get(getAPIURL('/vote/result/' + vote.id));

    expect(res.status).toBe(200);
  });

  /*
  it ('returns the results', async () => {
    try {
      const vote = await createVote(true);
      await updateVote(vote, {status: 'complete'});
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
  */
});
