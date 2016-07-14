var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
	defaultSort: '-time',
	nodelete: true,
	nocreate: true
});

Ballot.add({
	time: { type: Types.Datetime, default: Date.now },
	status: {
		type: Types.Select,
		options: [
			'error',
			// vote process status
			'signing', 'queued', 'pending', 'initialized', 'registered', 'complete',
			// vote cancellation process status
			'cancelling', 'cancelled'
		],
		required: true,
		initial: true
	},
	voter: { type: String, required: true, initial: true },
	bill: { type: Types.Relationship, ref: 'Bill', required: true, initial: true },
	error: { type: String }
});

transform.toJSON(Ballot);

Ballot.defaultColumns = 'time, status, voterAge, voterGender';
Ballot.register();
