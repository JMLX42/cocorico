var config = require('/opt/cocorico/api-web/config.json');

import request from './request';

export default async () => {
  var appId = config.testApp.id;
  var appSecret = config.testApp.secret;

  return request
    .post('https://127.0.0.1/api/oauth/token')
    .send({'grant_type': 'client_credentials'})
    .set('Authorization', 'Basic ' + new Buffer(appId + ':' + appSecret).toString('base64'))
    .then((res) => res.body.access_token);
}
