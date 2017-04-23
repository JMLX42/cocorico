import config from './config';

import request from './request';
import getAPIURL from './getAPIURL';
import getUserJWT from './getUserJWT';

export default async function(user, vote) {
  return request
    .get(getAPIURL('/ballot/' + vote.id))
    .set('Authorization', 'JWT ' + getUserJWT(user))
    .set('Cocorico-App-Id', config.testApp.id)
    .then(res => res.body.ballot);
}
