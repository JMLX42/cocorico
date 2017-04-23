import config from '/opt/cocorico/api-web/config.json';

import delay from 'timeout-as-promise';

import {
  request,
  getAPIURL,
  createVote,
  getRandomUser,
  getUserJWT,
  getBallotTransaction,
  sendBallot
} from 'cocorico-test';

describe('POST /ballot/:voteId', () => {
  it('returns 200 and a valid ballot', async () => {
    const vote = await createVote(true);
    const tx = await getBallotTransaction(vote, [0]);
    const user = getRandomUser();
    const res = await request
      .post(getAPIURL('/ballot/' + vote.id))
      .set('Authorization', 'JWT ' + getUserJWT(user))
      .set('Cocorico-App-Id', config.testApp.id)
      .send({'transaction': tx});

    expect(res.status).toBe(200);
    expect(res.body.ballot).not.toBeFalsy();
    expect(res.body.ballot.id).not.toBeFalsy();
    expect(res.body.ballot.updatedAt).not.toBeFalsy();
    expect(res.body.ballot.createdAt).not.toBeFalsy();
    expect(res.body.ballot.status).toBe('queued');
    expect(res.body.proof).not.toBeFalsy();
  });

  it('returns 403 and an error message when the user already voted', async () => {
    const vote = await createVote(true);
    const user = getRandomUser();

    try {
      const ballot1 = await sendBallot(user, vote, [0]);
      const ballot2 = await sendBallot(user, vote, [0]);

      expect(ballot2).toBeFalsy();
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.response.body.error).toBe('user already voted');
    }
  });

  it('returns 200 and a complete ballot', async () => {
    try {
      const vote = await createVote(true);
      const tx = await getBallotTransaction(vote, [0]);
      const user = getRandomUser();

      await request
        .post(getAPIURL('/ballot/' + vote.id))
        .set('Authorization', 'JWT ' + getUserJWT(user))
        .set('Cocorico-App-Id', config.testApp.id)
        .send({'transaction': tx});
      await delay(5000);

      const res = await request
        .get(getAPIURL('/ballot/' + vote.id))
        .set('Authorization', 'JWT ' + getUserJWT(user))
        .set('Cocorico-App-Id', config.testApp.id);

    } catch (e) {
      expect(e).toBeFalsy();
    }
  });
});

describe('GET /ballot/:voteId', () => {
  it('returns 401 and an error message when not authenticated', async () => {
    try {
      await request.get(getAPIURL('/ballot/424242424242424242424242'))
    } catch (err) {
      expect(err.response.body).toEqual({error: 'not authenticated'});
      expect(err.status).toBe(401);
    }
  });

  it('returns 404 when :voteId is invalid', async () => {
    try {
      const user = getRandomUser();
      await request
        .get(getAPIURL('/ballot/424242424242424242424242'))
        .set('Authorization', 'JWT ' + getUserJWT(user))
        .set('Cocorico-App-Id', config.testApp.id);
    } catch (err) {
      expect(err.status).toBe(404);
    }
  });
});
