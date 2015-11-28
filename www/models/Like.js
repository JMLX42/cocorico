var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Like = new keystone.List('Like', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' }
});

Like.add({
    createdAt: { type: Date, default: Date.now },
    author: { type: String, required: true, initial: true }
});

transform.toJSON(Like);

Like.defaultColumns = 'title, file';
Like.register();
