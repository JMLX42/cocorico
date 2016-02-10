var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Source = new keystone.List('Source', {
	defaultSort: '-time'
});

Source.add({
    title: { type: String, default: '', required: false, initial: true },
	url: { type: String, default: '', required: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	author: { type: String, required: false, default: '', initial: true },
	bill: { type: Types.Relationship, ref: 'Bill', required: true, initial: true },
	auto: { type: Types.Boolean, required: true, default: false },
	likes: { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true, noedit: true },
	score: { type: Types.Number, required: true, default: 0, format: false }
});

transform.toJSON(Source);

Source.defaultColumns = 'title, score';
Source.register();
