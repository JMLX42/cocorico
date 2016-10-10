import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import request from './getRequest';
import delay from 'timeout-as-promise';

async function createVote(url) {
  const accesToken = await getAccessToken();

  if (!url) {
    url = 'https://www.meetup.com';
  }

  return request
    .post(getAPIURL('/vote'))
    .set('Authorization', 'Bearer ' + accesToken)
    .send({'url': url})
    .then((res) => res.body.vote);
}

export default async function(waitForSmartContract, url) {
  if (waitForSmartContract) {
    const vote = await createVote();
    await delay(8000);

    return request.get(getAPIURL('/vote/' + vote.id))
      .then((res) => res.body.vote);
  } else {
    return createVote(url);
  }
}
