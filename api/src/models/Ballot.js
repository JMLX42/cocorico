var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
  defaultSort: '-createdAt',
  track: { createdAt: true, updatedAt: true },
  nodelete: config.env !== 'development',
  nocreate: true,
  noedit: true,
});

Ballot.add({
  status: {
    type: Types.Select,
    options: [
      'queued',
      'pending',
      'initialized',
      'initializing',
      'registered',
      'registering',
      'casting',
      'complete',
    ],
    default: 'queued',
    required: true,
    initial: true,
  },
  hash: { type: String, required: true, initial: true, index: true, unique: true },
  error: { type: Types.TextArray },
});

transform.toJSON(Ballot, (ballot) => {
  delete ballot.hash;
});

Ballot.defaultColumns = 'status, hash, createdAt, updatedAt';
Ballot.register();
