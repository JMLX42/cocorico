import cluster from 'cluster';

import winston from 'winston';

export default class extends winston.Logger {
  constructor(label) {
    super({
      transports: [
        new winston.transports.Console({
          label: label,
          handleExceptions: true,
          json: true,
          colorize: true,
          prettyPrint: true,
          timestamp: true,
        }),
      ],
      exitOnError: true,
    });
  }
}
