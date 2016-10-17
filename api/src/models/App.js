var keystone = require('keystone');
var transform = require('model-transform');
var srs = require('secure-random-string');

var Types = keystone.Field.Types;

var App = new keystone.List('App', {
  map: { name: 'title' },
});

App.add({
  title: { type: String, required: true, initial: true },
  secret: { type: Types.Key, required: true, default: () => srs(32).toLowerCase() },
  validURLs: { type: Types.TextArray },
  webhookURL: { type: Types.Text },
});

App.relationship({ path: 'votes', ref: 'Vote', refPath: 'app' });
App.relationship({ path: 'accessTokens', ref: 'AccessToken', refPath: 'client' });

App.schema.methods.isValidURL = function(url) {
  for (var validURL of this.validURLs) {
    if (url.indexOf(validURL) === 0) {
      return true;
    }
  }
  return false;
}

transform.toJSON(App, (app) => {
  delete app.secret;
  delete app.webhookURL;
});

App.defaultColumns = 'title, key, secret';
App.register();
