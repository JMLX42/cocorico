import queue from 'amqplib';

import logger from './logger';

export default async function(ballot, status) {
  if (!ballot.app.webhookURL) {
    logger.info({status:status}, 'App.webhookURL is not set: skipping webhook');
    return;
  }

  logger.info({status:status}, 'preparing to push webhook');

  const q = await queue.connect(null, {heartbeat:30});

  logger.info('connected to the webhook queue');

  const channel = await q.createChannel();

  logger.info('webhook channel created');

  await channel.assertQueue('webhook');

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
  channel.close();

  logger.info({status:status}, 'pushed webhook');
}
