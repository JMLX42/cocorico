var Reflux = require('reflux')
var config = require('/opt/cocorico/app-web/config.json');

module.exports = Reflux.createStore({
    init: function()
    {
        this._config = config;
    },

    getInitialState: function()
    {
        return this._config;
    }
});
