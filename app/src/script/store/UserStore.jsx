var Reflux = require('reflux')
var jquery = require('jquery');

var UserAction = require('../action/UserAction.jsx');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(UserAction.requireLogin, this._requireLoginHandler);
        this.listenTo(UserAction.listAuthProviders, this._fetchAuthProviders);

        this._currentUser = null;
        this._authProviders = null;
    },

    getInitialState: function()
    {
        return this;
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

    getAuthProviders: function()
    {
        return this._authProviders && this._authProviders !== true
            ? this._authProviders
            : null;
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
        ).error((xhr, voteStatus, err) => {
            this._currentUser = {error: xhr.status};
            this.trigger(this);
        });
    },

    _fetchAuthProviders: function()
    {
        if (this._authProviders === true)
            return;

        if (this._authProviders)
            return this.trigger(this);

        this._authProviders = true;

        jquery.get(
            '/api/auth/providers',
            (data) => {
                this._authProviders = data.providers;
                this.trigger(this);
            }
        ).error((xhr, voteStatus, err) => {
            this._authProviders = {error: xhr.status};
            this.trigger(this);
        });
    }
});
