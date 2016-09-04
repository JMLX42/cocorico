var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var App = new keystone.List('App', {
});

App.add({
    title: { type: String, required: true, initial: true },
    secret: { type: Types.Password, required: true, initial: true },
    validURLs: { type: Types.TextArray }
});

App.relationship({ path: 'votes', ref: 'Vote', refPath: 'app' });
App.relationship({ path: 'accessTokens', ref: 'AccessToken', refPath: 'client' });

App.schema.methods.isValidURL = function(url) {
    for (var validURL of this.validURLs) {
        if (url.indexOf(validURL) == 0) {
            return true;
        }
    }
    return false;
}

transform.toJSON(App);

App.defaultColumns = 'title, key, secret';
App.register();
