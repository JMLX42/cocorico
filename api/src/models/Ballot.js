var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
  defaultSort: '-updatedAt',
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
      'registered',
      'complete',
      'error',
    ],
    default: 'queued',
    required: true,
    initial: true,
  },
  hash: { type: String, required: true, initial: true },
  error: { type: String },
});

transform.toJSON(Ballot);

Ballot.defaultColumns = 'status, hash, createdAt, updatedAt';
Ballot.register();
