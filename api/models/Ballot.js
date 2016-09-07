var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
	defaultSort: '-updatedAt',
	track: { createdAt: true, updatedAt: true },
	nodelete: true,
	nocreate: true
});

Ballot.add({
	status: {
		type: Types.Select,
		options: ['signing', 'queued', 'pending', 'initialized', 'registered', 'complete', 'error'],
		required: true,
		initial: true,
		noedit: true
	},
	voter: { type: String, required: true, initial: true, noedit: true  },
	vote: { type: Types.Relationship, ref: 'Vote', required: true, initial: true, noedit: true  },
	error: { type: String, noedit: true }
});

transform.toJSON(Ballot);

Ballot.defaultColumns = 'time, status, vote';
Ballot.register();
