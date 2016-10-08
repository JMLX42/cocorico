var config = require('/opt/cocorico/api-web/config.json');

module.exports = function(route) {
  // FIXME: protocole should be read from the config
  return 'https://' + config.hostname + '/api' + route;
}
