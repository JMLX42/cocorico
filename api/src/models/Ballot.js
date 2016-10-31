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
  hash: { type: String, required: true, initial: true },
  error: { type: Types.TextArray },
});

transform.toJSON(Ballot, (ballot) => {
  // FIXME: this is a big workaround for the client that expects Ballot.error
  // to be either falsy or set with an actual error message.
  if (ballot.error.length === 0) {
    delete ballot.error;
  }
});

Ballot.defaultColumns = 'status, hash, createdAt, updatedAt';
Ballot.register();
