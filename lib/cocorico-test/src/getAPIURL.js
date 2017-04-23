import config from './config';

export default function(route) {
  // FIXME: protocole should be read from the config
  return 'https://' + config.hostname + '/api' + route;
}
