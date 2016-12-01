import {request, getAPIURL} from 'cocorico-test';

describe('/ping', () => {
  it('returns 200 and "pong"', async () => {
    const res = await request.get(getAPIURL('/ping'));

    expect(res.status).toBe(200);
    expect(res.body).toBe('pong');
  });
});
