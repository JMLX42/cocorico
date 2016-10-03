var config = require('/opt/cocorico/api-web/config.json');

if (config.env === 'development') {
  // Allow self-signed SSL certificates.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
