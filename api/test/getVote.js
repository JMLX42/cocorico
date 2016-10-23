import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import request from './getRequest';
import delay from 'timeout-as-promise';

var id = 0;

async function createVote(url) {
  const accesToken = await getAccessToken();

  if (!url) {
    url = 'https://localhost/?test=' + id++;
  }

  return request
    .post(getAPIURL('/vote'))
    .set('Authorization', 'Bearer ' + accesToken)
    .send({'url': url})
    .then((res) => res.body.vote);
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
