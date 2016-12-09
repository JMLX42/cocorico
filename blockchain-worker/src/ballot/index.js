import 'babel-polyfill';

import config from '/opt/cocorico/blockchain-worker/config.json';

import cluster from 'cluster';

import Logger from 'cocorico-logger';

const logger = new Logger('ballot-service');

if (cluster.isMaster) {

  logger.info(
    'spawning consumers',
    {ballotConsumerCount: config.ballotConsumerCount}
  );

  for (var i = 0; i < config.ballotConsumerCount; i++) {
    cluster.fork();
  }

  logger.info('consumers started');

  // If a worker exits, we wait 30 seconds and restart it.
  cluster.on('exit', (deadWorker, code, signal) => {
    logger.info('consumer exited, waiting 10s', {workerId: deadWorker.id});

    setTimeout(
      () => {
        var newWorker = cluster.fork();

        logger.info('restarted consumer', {workerId: newWorker.id});
      },
      10000
    );
  });
} else {
  var ballotConsumer = require('./ballot-consumer');

  ballotConsumer.run();
}
