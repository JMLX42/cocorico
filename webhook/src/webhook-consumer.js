import request from 'superagent';
import cluster from 'cluster';
import amqplib from 'amqplib';
import Logger from 'cocorico-logger';

const logger = new Logger('webhook-consumer-' + cluster.worker.id);

const RETRY_DELAY = 1000;//60 * 1000;  // 1 minute in milliseconds
const RETRY_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const TIMEOUT = 30000; // 30 seconds

function isWebhookEvent(content) {
  return !!content.event && !!content.url && !!content.createdAt;
}

function handleWebhookError(channel, messageData, error) {
  logger.error({error:error}, 'failed to call webhook, retrying later');

  if (!('firstTriedAt' in messageData)) {
    messageData.firstTriedAt = Date.now();
  }
  messageData.lastTriedAt = Date.now();

  channel.sendToQueue(
    'webhooks',
    new Buffer(JSON.stringify(messageData)),
    { persistent : true }
  );
}

async function handleMessage(channel, msg) {
  const messageData = JSON.parse(msg.content.toString());

  logger.info({message:messageData}, 'message received');

  // Skip invalid messages
  if (!isWebhookEvent(messageData)) {
    logger.error({ message: messageData }, 'invalid message, skipping');
    channel.ack(msg);
    return;
  }

  // Delay messages already processed recently
  if (!!messageData.lastTriedAt) {
    var elapsedTime = Date.now() - messageData.lastTriedAt;
    if (elapsedTime < RETRY_DELAY) {
      channel.nack(msg);  // append message back to queue
      return;
    }
  }

  // Skip messages failing for too long
  if (!!messageData.firstTriedAt) {
    var elapsedTime = Date.now() - messageData.firstTriedAt;
    if (elapsedTime > RETRY_TTL) {
      logger.error({ message: messageData }, 'message failed for too long, skipping');
      channel.ack(msg);
      return;
    }
  }

  // Send HTTP request to remote webhook
  logger.info({ message: messageData }, 'calling webhook');

  try {
    const res = await request
      .post(messageData.url)
      .timeout(TIMEOUT)
      .send({event: messageData.event});

    // if the server answered with 2XX
    if (res.status >= 200 && res.status < 300) {
      logger.info({ http_status: res.status }, 'webhook call succeeded');
    } else {
      // any other code is considered a failure
      handleWebhookError(channel, messageData, { http_status: res.status });
    }
  } catch (err) {
    handleWebhookError(channel, messageData, err);
  }

  channel.ack(msg);
}

var queue = null;
var channel = null;

export async function run() {
  try {
    logger.info('connecting to the queue');

    queue = await amqplib.connect(null, {heartbeat:30});

    logger.info('connected to the queue');

    channel = await queue.createChannel();

    logger.info('channel created, waiting for messages...');

    await channel.assertQueue('webhooks', {autoDelete: false, durable: true});
    channel.consume('webhooks', (message) => handleMessage(channel, message));
  } catch (err) {
    logger.error({error : err}, 'queue error');

    if (!!channel) {
      await channel.close();
    }

    if (!!queue) {
      await queue.close();
    }

    process.exit(1);
  }
}
