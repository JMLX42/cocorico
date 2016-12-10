import config from '/opt/cocorico/api-web/config.json';

export default function(route) {
  // FIXME: protocole should be read from the config
  return 'https://' + config.hostname + '/api' + route;
}
