import config from './config';

import request from './request';
import getAPIURL from './getAPIURL';
import getUserJWT from './getUserJWT';

export default async function(user, vote, tx) {
  return request
    .post(getAPIURL('/ballot/' + vote.id))
    .set('Authorization', 'JWT ' + getUserJWT(user))
    .set('Cocorico-App-Id', config.testApp.id)
    .send({'transaction': tx})
    .then((res) => res.body.ballot);
}
