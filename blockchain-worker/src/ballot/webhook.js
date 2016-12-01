import amqplib from 'amqplib';

import cluster from 'cluster';
import Logger from 'cocorico-logger';

const logger = new Logger('ballot-consumer-' + cluster.worker.id);

var queue = null;
var channel = null;

process.once('SIGINT', async () => {
  logger.info('closing webhook queue/channel');

  if (!!channel) {
    await channel.close();
    channel = null;
  }

  if (!!queue) {
    await queue.close();
    queue = null;
  }
});

export default async function(ballot, status) {
  if (!ballot.app.webhookURL) {
    logger.info('App.webhookURL is not set: skipping webhook', {status: status});
    return;
  }

  logger.info('preparing to push webhook', {status: status});

  if (!queue) {
    queue = await amqplib.connect(null, {heartbeat:30});
    channel = await queue.createChannel();
    await channel.assertQueue('webhooks', {autoDelete: false, durable: true});
  }

  var msg = {
    url: ballot.app.webhookURL,
    event: {
      app: ballot.app,
      vote: {id: ballot.vote.id},
      user: {sub: ballot.user.sub},
      status: status,
    },
    createdAt: Date.now(),
  };

  channel.sendToQueue(
    'webhooks',
    new Buffer(JSON.stringify(msg)),
    { persistent : true }
  );

  logger.info('pushed webhook', {status: status});
}
