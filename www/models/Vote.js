var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
	defaultSort: '-createdAt'
});

Vote.add({
	value: { type: Boolean, default: true, required: true, initial: true },
	createdAt: { type: Date, default: Date.now },
	author: { type: Types.Relationship, ref: 'User', required: true, initial: true },
	poll: { type: Types.Relationship, ref: 'Poll', required: true, initial: true }
});

transform.toJSON(Vote);

Vote.defaultColumns = 'value';
Vote.register();
