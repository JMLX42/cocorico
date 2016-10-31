import amqplib from 'amqplib';

var conn = null;
var ch = null;

export default async function(data) {
  if (!conn) {
    conn = await amqplib.connect();
    ch = await conn.createChannel();
    ch.assertQueue('ballots', {autoDelete: false, durable: true});
  }

  var ballotObj = {ballot : data};

  ch.sendToQueue(
    'ballots',
    new Buffer(JSON.stringify(ballotObj)),
    {persistent : true}
  );
}
