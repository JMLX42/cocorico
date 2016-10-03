var Promise = this.Promise || require('promise');
var request = require('superagent-promise')(require('superagent'), Promise);

describe('/user/me', () => {
  it('returns 401 when not signed in', () => {
    return request
      .get('https://127.0.0.1/api/user/me')
      .then(
        (res) => null,
        (err) => expect(err.status).toBe(401)
      );
  });
});
