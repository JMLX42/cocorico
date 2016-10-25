var deepmerge = require('deepmerge');
var cookie = require('js-cookie');

var messages = require('/opt/cocorico/app-web/messages.js');
var config = require('/opt/cocorico/app-web/config.json');

const defaultLocale = 'en-US';

if (process.env.NODE_ENV === 'production') {
  for (var l in messages) {
    if (l !== defaultLocale) {
      messages[l] = deepmerge(messages[defaultLocale], messages[l]);
    }
  }
}

module.exports = {
  getSupportedLocales: function() {
    return config.supportedLocales;
  },

  getCurrentLocale: function() {
    var locale = location.search
      .split(/[\?&]/)
      .filter((e) => !!e)
      .map((e) => e.split('='))
      .map(e => e[0] === 'lang' ? e[1] : false)
      .filter(e => !!e)[0];

    // if the locale was explicitely set using ?lang=
    if (!!locale) {
      // we save it for later
      cookie.set('lang', locale);
    } else {
      // we try to read the saved one
      locale = cookie.get('lang');

      if (!locale) {
        // finally, we read it from the navigator object
        locale = navigator.language.split('-');
        if (!!locale[1]) {
          locale = `${locale[0]}-${locale[1].toUpperCase()}`
        }
      }
    }

    return locale || navigator.language;
  },

  getLocaleMessages: function(locale) {
    return locale in messages ? messages[locale] : messages[defaultLocale];
  },

  getCurrentLocaleMessages: function() {
    return this.getLocaleMessages(this.getCurrentLocale());
  },
}
