var config = require('/opt/cocorico/api-web/config.json');

import request from './getRequest';
import getAPIURL from './getAPIURL';
import getUserJWT from './getUserJWT';
import getBallotTransaction from './getBallotTransaction';

export default async function(vote, ballotValue) {
  const tx = await getBallotTransaction(vote, ballotValue)

  return request
    .post(getAPIURL('/ballot/' + vote.id))
    .set('Authorization', 'JWT ' + getUserJWT())
    .set('Cocorico-App-Id', config.testApp.id)
    .send({'transaction': tx})
    .then(res => res.body.ballot);
}
