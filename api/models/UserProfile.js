var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var UserProfile = new keystone.List('UserProfile');

UserProfile.add({
	user: { type: String, required: true, initial: true },
	type: { type: Types.Select, options: ['nickname', 'realname'] },
	name: { type: String }
});

transform.toJSON(UserProfile);

UserProfile.defaultColumns = 'hash, name, email, isAdmin';
UserProfile.register();
