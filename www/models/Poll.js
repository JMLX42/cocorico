var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Poll = new keystone.List('Poll', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Poll.add({
	title: { type: String, required: true },
	author: { type: Types.Relationship, ref: 'User' },
	createdAt: { type: Date, default: Date.now },
    publishedAt: Date,
	content: {
        brief: { type: Types.Html, wysiwyg: true, height: 150 },
        extended: { type: Types.Html, wysiwyg: true, height: 400 }
    }
});

Poll.relationship({ path: 'votes', ref: 'Vote', refPath: 'poll' });

transform.toJSON(Poll);

Poll.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Poll.register();
