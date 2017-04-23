import config from './config';

import getAPIURL from './getAPIURL';
import request from './request';

export default async () => {
  const appId = config.testApp.id;
  const appSecret = config.testApp.secret;

  return request
    .post(getAPIURL('/oauth/token'))
    .send({'grant_type': 'client_credentials'})
    .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'))
    .then((res) => res.body.access_token);
}
