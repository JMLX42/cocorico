import 'babel-polyfill';

import config from '/opt/cocorico/api-web/config.json';
import cluster from 'cluster';
import bunyan from 'bunyan';

const log = bunyan.createLogger({name: 'ballot-service'});

if (cluster.isMaster) {

  log.info('spawning consumers');

  for (var i = 0; i < config.ballotConsumerCount; i++) {
    cluster.fork();
  }

  log.info('consumers started');

  // If a worker exits, we wait 30 seconds and restart it.
  cluster.on('exit', (deadWorker, code, signal) => {
    log.info({workerId: deadWorker.id}, 'consumer exited, waiting 30s');

    setTimeout(
      () => {
        var newWorker = cluster.fork();

        log.info({workerId: newWorker.id}, 'restarted consumer');
      },
      30000
    );
  });
} else {
  var ballotConsumer = require('./ballot-consumer');

  ballotConsumer.run();
}
