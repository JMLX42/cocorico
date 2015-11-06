var Reflux = require('reflux')
var jquery = require('jquery');

var UserAction = require('../action/UserAction.jsx');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(UserAction.requireLogin, this._requireLoginHandler);

        this._currrentUser = null;
    },

    getCurrentUser: function()
    {
        return this._currrentUser;
    },

    isAuthenticated: function()
    {
        return typeof(this._currrentUser) == 'object' && !!this._currrentUser;
    },

    _requireLoginHandler: function()
    {
        if (!this.isAuthenticated())
            this._fetchCurrentUser();
        else
            this.trigger(this);
    },

    _fetchCurrentUser: function()
    {
        if (this._currrentUser === true)
            return;

        if (this._currrentUser)
            this.trigger(this);

        this._currrentUser = true;

        jquery.get(
            '/api/user/me',
            (data) => {
                this._currrentUser = data.user;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._currrentUser = null;
            this.trigger(this);
        });
    }
});
