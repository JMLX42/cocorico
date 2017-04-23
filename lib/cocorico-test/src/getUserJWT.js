import config from './config';

import jwt from 'jsonwebtoken';

export default function(user) {
  return jwt.sign(user, config.testApp.secret);
}
