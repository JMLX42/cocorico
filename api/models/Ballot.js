var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
	defaultSort: '-time',
	nodelete: true,
	nocreate: true
});

Ballot.add({
	value: { type: String, default: true, required: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	status: {
		type: Types.Select,
		options: ['signing', 'pending', 'initialized', 'registered', 'complete', 'error'],
		required: true,
		initial: true
	},
	voter: { type: String, required: true, initial: true },
	bill: { type: Types.Relationship, ref: 'Bill', required: true, initial: true },
	voterAge: { type: Types.Number, required: true, initial: true },
	voterGender: { type: Types.Select, options: ['male', 'female'], initial: true },
	error: { type: String }
});

transform.toJSON(Ballot);

Ballot.defaultColumns = 'voter, value, time';
Ballot.register();
