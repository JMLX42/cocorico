import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';

const Types = keystone.Field.Types;

const Ballot = new keystone.List('Ballot', {
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
