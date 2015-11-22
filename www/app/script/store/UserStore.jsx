var Reflux = require('reflux')
var jquery = require('jquery');

var UserAction = require('../action/UserAction.jsx');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(UserAction.requireLogin, this._requireLoginHandler);

        this._currentUser = null;
    },

    getCurrentUser: function()
    {
        return this._currentUser && !this._currentUser.error
            ? this._currentUser
            : null;
    },

    isAuthenticated: function()
    {
        return typeof(this._currentUser) == 'object' && !!this._currentUser
            && !this._currentUser.error;
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
        if (this._currentUser === true)
            return;

        if (this._currentUser)
            return this.trigger(this);

        this._currentUser = true;

        jquery.get(
            '/api/user/me',
            (data) => {
                this._currentUser = data.user;
                this.trigger(this);
            }
        ).error((xhr, textStatus, err) => {
            this._currentUser = {error: xhr.status};
            this.trigger(this);
        });
    }
});
