import winston from 'winston';

export default new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      json: true,
    }),
  ],
  exitOnError: true,
});
