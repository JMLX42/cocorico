import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import request from './getRequest';
import delay from 'timeout-as-promise';

var vote = null;

afterAll(() => {
  vote = null;
})

async function createVote(url) {
  if (!!vote) {
    return new Promise((resolve) => resolve(vote));
  }

  const accesToken = await getAccessToken();

  if (!url) {
    url = 'https://localhost/';
  }

  return request
    .post(getAPIURL('/vote'))
    .set('Authorization', 'Bearer ' + accesToken)
    .send({'url': url})
    .then((res) => vote = res.body.vote);
}

export default async function(waitForSmartContract, url) {
  if (waitForSmartContract) {
    const v = await createVote();
    await delay(10000);

    return request
      .get(getAPIURL('/vote/' + v.id))
      .then((res) => res.body.vote);
  } else {
    return createVote(url);
  }
}
