var messages = require('/opt/cocorico/app-web/messages.js');
var config = require('/opt/cocorico/app-web/config.json');

module.exports = {
  getSupportedLocales: function() {
    return config.supportedLocales;
  },

  getCurrentLocale: function() {
    var locale = navigator.language.split('-');

    return locale[1]
      ? `${locale[0]}-${locale[1].toUpperCase()}`
      : navigator.language;
  },

  getLocaleMessages: function(locale) {
    return locale in messages ? messages[locale] : messages['en-US'];
  },

  getCurrentLocaleMessages: function() {
    return this.getLocaleMessages(this.getCurrentLocale());
  },
}
