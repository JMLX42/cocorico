import config from '/opt/cocorico/api-web/config.json';
import jwt from 'jsonwebtoken';

export default function(user) {
  if (!user) {
    user = {};
  }

  if (!user.sub) {
    user.sub = '1234567890';
  }

  user.iss = config.testApp.id;

  return jwt.sign(user, config.testApp.secret);
}
