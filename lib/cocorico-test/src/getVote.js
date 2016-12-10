import getAPIURL from './getAPIURL';
import request from './request';

export default async function(id) {
  return await request
    .get(getAPIURL('/vote/' + id))
    .then((res) => res.body.vote);
}
