var keystone = require('keystone');
var async = require('async');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var deepPopulate = require('mongoose-deep-populate')(keystone.mongoose);

var Types = keystone.Field.Types;

var Bill = new keystone.List('Bill', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Bill.add({
	title: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
    publishedAt: Date,
	content: { type: Types.Markdown, wysiwyg: true, height: 400 },
    author: { type: String, required: true, initial: true },
    status: { type: Types.Select, options: ['draft', 'review', 'debate', 'vote', 'published'], default: 'draft' },
    likes: { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true, noedit: true },
    score: { type: Types.Number, required: true, default: 0, format: false },
    voteContractAddress: { type: String },
    parts: { type: Types.Relationship, ref: 'BillPart', required: true, initial: true, many: true, noedit: true }
});

Bill.schema.plugin(deepPopulate);

Bill.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'bill' });
Bill.relationship({ path: 'sources', ref: 'Source', refPath: 'bill' });

transform.toJSON(Bill);

Bill.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Bill.register();
