var keystone = require('keystone');
var transform = require('model-transform');
var Types = keystone.Field.Types;

var Admin = new keystone.List('Admin');

Admin.add({
  name: { type: String, initial: true },
  email: { type: Types.Email, initial: true, index: true, unique: true },
  password: { type: Types.Password, initial: true },
}, 'Permissions', {
  isAdmin: { type: Boolean, label: 'Can access Keystone', index: true },
});

// Provide access to Keystone
Admin.schema.virtual('canAccessKeystone').get(function() {
  return this.isAdmin;
});

transform.toJSON(Admin);

Admin.defaultColumns = 'hash, name, email, isAdmin';
Admin.register();
