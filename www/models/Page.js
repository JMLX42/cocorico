var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Page = new keystone.List('Page', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Page.add({
	title: { type: String, required: true },
	author: { type: Types.Relationship, ref: 'User' },
	createdAt: { type: Date, default: Date.now },
    publishedAt: Date,
    published: { type: Boolean, default: false },
    showInNavBar: { type: Boolean, default: false },
    contentType: { type: Types.Select, options: ['Markdown', 'HTML'] },
    markdown: { type: Types.Markdown, wysiwyg: true, height: 400, dependsOn: { contentType : 'Markdown' } },
    html: { type: Types.Html, wysiwyg: true, height: 400, dependsOn: { contentType : 'HTML' } }
});

transform.toJSON(Page);

Page.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Page.register();
