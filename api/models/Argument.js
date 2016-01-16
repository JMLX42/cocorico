var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Argument = new keystone.List('Argument', {
	defaultSort: '-time',
	nodelete: true//,
	// nocreate: true
});

Argument.add({
    title: { type: String, default: '', required: true, initial: true },
	content: { type: String, default: '', required: true, initial: true },
	value: { type: Types.Boolean, default: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	author: { type: String, required: true, initial: true },
	text: { type: Types.Relationship, ref: 'Text', required: true, initial: true },
	likes: { type: Types.Relationship, ref: 'Like', many: true, noedit: true },
	score: { type: Types.Number, required: true, default: 0, format: false }
});

transform.toJSON(Argument);

Argument.defaultColumns = 'author, value, time';
Argument.register();
