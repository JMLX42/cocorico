import config from '/opt/cocorico/api-web/config.json';

import keystone from 'keystone';
import transform from 'model-transform';

const Types = keystone.Field.Types;

const VerifiedBallot = new keystone.List('VerifiedBallot', {
  noedit: config.env !== 'development',
  nodelete: config.env !== 'development',
  nocreate: config.env !== 'development',
  track: { createdAt: true },
});

VerifiedBallot.add({
  vote: { type: Types.Relationship,ref: 'Vote', required: true, initial: true },
  valid: { type: Types.Boolean, required: true, initial: true },
  transactionHash: { type: Types.Text, initial: true },
  voterAddress: {type: Types.Text, required: true, initial: true },
});

transform.toJSON(VerifiedBallot);

VerifiedBallot.defaultColumns = 'transactionHash, createdAt';

VerifiedBallot.register();
