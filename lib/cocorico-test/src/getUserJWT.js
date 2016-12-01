import config from '/opt/cocorico/api-web/config.json';

import jwt from 'jsonwebtoken';

export default function(user) {
  return jwt.sign(user, config.testApp.secret);
}
