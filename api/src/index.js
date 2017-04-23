import 'babel-polyfill';

try {
  require('source-map-support').install();
} catch (e) {
}

import config from '/opt/cocorico/api-web/config.json';
import keystone from 'keystone';
import srs from 'secure-random-string';
import logger from './logger';

keystone.init({

  'name': 'cocorico',
  'brand': 'cocorico',
  'admin path': 'admin',

  'views': 'templates/views',
  'view engine': 'jade',

  'wysiwyg images': true,
  'wysiwyg menubar': true,
  'wysiwyg additional plugins': 'table',

  'mongo' : config.mongo.uri,

  'auto update': false,
  'session': true,
  'auth': true,
  'user model': 'Admin',
  'cookie secret': 'WIQ1S44fK0eOCTf!%iQ@Cc@0oKmjOAj5I37#C^#af9OaOXuy2xF97k*l5Q1Wxe49',
  'session store': 'mongo',

  'logger': false,
});

keystone.import('models');

keystone.set('locals', {
  _: require('underscore'),
  env: keystone.get('env'),
  utils: keystone.utils,
  editable: keystone.content.editable,
});

keystone.set('routes', require('./routes'));
keystone.set('nav', {
  'apps': 'apps',
  'pages': ['Page', 'Media'],
  'votes': ['Vote', 'Ballot', 'Source', 'VerifiedBallot'],
  'events': ['Event', 'IPAddress'],
});

logger.info('starting');

keystone.start();

logger.info('started');

// synchronize the blacklisted IP addresses with iptables
const IPAddress = keystone.list('IPAddress');
IPAddress.syncWithIPTables();
