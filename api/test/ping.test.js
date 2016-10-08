var request = require('superagent-promise')(require('superagent'), Promise);

describe('/ping', () => {
  it('returns 200 and "pong"', async () => {
    const res = await request.get('https://local.cocorico.cc/api/ping');

    expect(res.status).toBe(200);
    expect(res.body).toBe('pong');
  });
});
