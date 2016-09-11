var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var AccessToken = new keystone.List('AccessToken', {
    hidden: true,
    noedit: true,
    nodelete: true,
    nocreate: true
});

AccessToken.add({
    token: { type: Types.Text, required: true, initial: true, noedit: true  },
    expirationDate: { type: Types.Datetime, required: true, initial: true, noedit: true  },
    client: { type: Types.Relationship, ref: 'App', required: true, initial: true, noedit: true },
    scope: { type: Types.Text, default: '*', initial: true, noedit: true  }
});

transform.toJSON(AccessToken);

AccessToken.defaultColumns = 'token, expirationDate, client';

AccessToken.register();
