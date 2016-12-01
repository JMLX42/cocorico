import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';
import request from './request';
import delay from 'timeout-as-promise';

var id = 0;

async function createVote(data) {
  const accesToken = await getAccessToken();

  if (!data) {
    data = {};
  }

  if (!data.url) {
    data.url = 'https://localhost/?test=' + id++;
  }

  return request
    .post(getAPIURL('/vote'))
    .set('Authorization', 'Bearer ' + accesToken)
    .send(data)
    .then((res) => res.body.vote);
}

export default async function(waitForSmartContract, data) {
  var v = await createVote(data);
  if (waitForSmartContract) {
    while (!v.voteContractABI) {
      await delay(5000);
      v = await request
        .get(getAPIURL('/vote/' + v.id))
        .then((res) => res.body.vote);
    }
    return v;
  } else {
    return v;
  }
}
