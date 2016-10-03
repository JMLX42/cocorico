var request = require('superagent');

it('/user/me should return 403 when not signed in', () => {
  request.get('https://127.0.0.1/api/user/me').end((err, res) => {
    expect(err.status).toBe(401);
  });
});
