import request from './request';
import getAccessToken from './getAccessToken';
import getAPIURL from './getAPIURL';

export default async function(vote, data) {
  const accesToken = await getAccessToken();

  return request
    .put(getAPIURL('/vote/') + vote.id)
    .set('Authorization', 'Bearer ' + accesToken)
    .send(data)
    .then((res) => res.body.vote);
}
