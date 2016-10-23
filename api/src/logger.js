var winston = require('winston');

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      json: true,
    }),
  ],
  exitOnError: true,
});
