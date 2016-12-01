import config from '/opt/cocorico/api-web/config.json';

import request from './request';
import getAPIURL from './getAPIURL';
import getUserJWT from './getUserJWT';
import getBallotTransaction from './getBallotTransaction';
import sendBallotTransaction from './getBallotTransaction';

export default async function(user, vote, ballotValue) {
  const tx = await getBallotTransaction(vote, ballotValue);

  return sendBallotTransaction(user, vote, tx);
}
