var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var BillPart = new keystone.List('BillPart', {
    defaultSort: '-order'
});

BillPart.add({
	title:     { type: String, required: true, initial: true },
	level:     { type: Types.Number, required: true, initial: true },
    order:     { type: Types.Number, required: true, initial: true },
	content:   { type: String, required: true, initial: true },
    likes:     { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true, noedit: true },
    score:     { type: Types.Number, required: true, default: 0, format: false }
});

transform.toJSON(BillPart);

BillPart.defaultColumns = 'title, level, order, score';

BillPart.register();
