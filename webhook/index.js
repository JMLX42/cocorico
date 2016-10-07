var bunyan = require('bunyan');
var request = require('superagent');
var noCache = require('superagent-no-cache')

var log = bunyan.createLogger({name: "webhook"});

var RETRY_DELAY = 60;

function assertMessageIsWebhookEvent(msg) {
    return !!msg.event && !!msg.url && !!msg.createdAt;
}

require('amqplib/callback_api').connect(
    'amqp://localhost',
    (err, conn) => {
        if (err != null) {
            return log.error({error: err}, 'queue connection error');
        }

        conn.createChannel((err, ch) => {
            if (err != null) {
                return log.error({error: err}, 'queue channel creation error');
            }

            ch.assertQueue('webhooks');
            ch.consume('webhooks', (msg) => {
                if (msg !== null) {
                    msg = JSON.parse(msg.content.toString());

                    if (!assertMessageIsWebhookEvent(msg)) {
                        // FIXME: major error here, should we stop the service ?
                        log.error(
                            { message: msg },
                            'assertion failed: queue message is not a valid webhook'
                        );
                        return ;
                    }

                    log.info({ webhook: msg }, 'handling webhook');

                    if (!!msg.lastTriedAt && (msg.lastTriedAt - msg.lastTriedAt > RETRY_DELAY)) {
                        log.info({ webhook: msg }, 'delaying webhook');
                        ch.nack(msg, false, true);
                        return;
                    }

                    log.info({ webhook: msg }, 'calling webhook');

                    request
                        .user(noCache)
                        .post(msg.url)
                        .send({event: msg.event})
                        .end((err, res) => {
                            if (err) {
                                return log.error({ error: err }, 'webhook error');
                            }

                            if (res.ok) {
                                log.info({ status: res.status }, 'webhook call succeeded');
                                ch.ack(msg);
                            } else {
                                log.info({ status: res.status }, 'webhook call failed');
                                msg.lastTriedAt = Date.now() / 1000;
                                ch.nack(msg, false, true);
                            }
                        });
                }
            });
        });
    }
);
