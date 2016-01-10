var keystone = require('keystone');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var Types = keystone.Field.Types;

var Like = new keystone.List('Like', {
});

Like.add({
    createdAt: { type: Date, default: Date.now, required: true },
    author: { type: String, required: true, initial: true, noedit: true },
    value: { type: Types.Boolean, required: true, initial: true, noedit: true }
});

transform.toJSON(Like);

Like.defaultColumns = 'createdAt, value';
Like.register();
