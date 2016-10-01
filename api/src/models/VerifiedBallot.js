var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var VerifiedBallot = new keystone.List('VerifiedBallot', {
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
