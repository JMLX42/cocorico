require('babel-polyfill');

try {
  require('source-map-support').install();
} catch (e) {
}

var config = require('/opt/cocorico/api-web/config.json');
var keystone = require('keystone');
var srs = require('secure-random-string');
var logger = require('./logger');

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
  'cookie secret': srs(64),

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
});

logger.info('starting');

keystone.start();

logger.info('started');
