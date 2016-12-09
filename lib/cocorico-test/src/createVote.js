import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import request from './request';
import delay from 'timeout-as-promise';

var id = 0;

export default async function(waitForSmartContract, data) {
  const accesToken = await getAccessToken();

  if (!data) {
    data = {};
  }

  id++;

  if (!('url' in data)) {
    data.url = 'https://localhost/?test=' + id;
  }

  if (!('title' in data)) {
    data.title = 'Test ' + id;
  }

  var vote = await request
    .post(getAPIURL('/vote'))
    .set('Authorization', 'Bearer ' + accesToken)
    .send(data)
    .then((res) => res.body.vote);

  if (waitForSmartContract) {
    while (!vote.voteContractABI) {
      await delay(5000);
      vote = await request
        .get(getAPIURL('/vote/' + vote.id))
        .then((res) => res.body.vote);
    }
  }

  return vote;
}
