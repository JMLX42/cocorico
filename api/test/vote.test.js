var Promise = this.Promise || require('promise');
var request = require('superagent-promise')(require('superagent'), Promise);

describe('/vote/:voteId', () => {
  it('returns 404 when :voteId is invalid', () => {
    return request
      .get('https://local.cocorico.cc/api/vote/424242424242424242424242')
      .then(
        (res) => null,
        (err) => expect(err.status).toBe(400)
      );
  });

  it('returns an empty response when :voteId is invalid', () => {
    return request
      .get('https://local.cocorico.cc/api/vote/424242424242424242424242')
      .then(
        (res) => null,
        (err) => expect(err.response.body).toEqual({})
      );
  });
});
