var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var User = new keystone.List('User');

User.add({
	name: { type: String, initial: true },
	email: { type: Types.Email, initial: true, index: true },
	password: { type: Types.Password, initial: true }
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});

transform.toJSON(User);

User.defaultColumns = 'hash, name, email, isAdmin';
User.register();
