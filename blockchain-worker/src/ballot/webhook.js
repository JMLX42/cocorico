import amqplib from 'amqplib';

import logger from './logger';

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
    logger.info({status:status}, 'App.webhookURL is not set: skipping webhook');
    return;
  }

  logger.info({status:status}, 'preparing to push webhook');

  if (!queue) {
    queue = await amqplib.connect(null, {heartbeat:30});
    channel = await queue.createChannel();
    await channel.assertQueue('webhook', {autoDelete: false, durable: true});
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

  channel.sendToQueue('webhooks',
    new Buffer(JSON.stringify(msg)),
    { persistent : true }
  );

  logger.info({status:status}, 'pushed webhook');
}
