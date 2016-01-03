var keystone = require('keystone');
var async = require('async');
var transform = require('model-transform');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source');

var Types = keystone.Field.Types;

var Text = new keystone.List('Text', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Text.add({
	title: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
    publishedAt: Date,
	content: { type: Types.Markdown, wysiwyg: true, height: 400 },
    author: { type: String, required: true, initial: true },
    status: { type: Types.Select, options: ['draft', 'review', 'debate', 'published'], default: 'draft' },
    likes: { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true, noedit: true },
    score: { type: Types.Number, required: true, default: 0, format: false }
});

Text.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'text' });
Text.relationship({ path: 'sources', ref: 'Source', refPath: 'text' });

transform.toJSON(Text);

Text.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Text.register();
