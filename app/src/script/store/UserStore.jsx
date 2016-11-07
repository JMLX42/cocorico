var Reflux = require('reflux');
var jquery = require('jquery');

var UserAction = require('../action/UserAction'),
  RouteAction = require('../action/RouteAction');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(UserAction.requireLogin, this._requireLoginHandler);
    this.listenTo(UserAction.listAuthProviders, this._fetchAuthProviders);
    this.listenTo(RouteAction.change, this._routeChangeHandler);

    this._currentUser = null;
    this._authProviders = null;
    this._authError = null;

    jquery.ajaxPrefilter(this._ajaxPrefilter);
    jquery(document).ajaxError(this._ajaxError);
  },

  attemptedJWTAuthentication() {
    return !!this._jwt && !!this._appId;
  },

  getInitialState: function() {
    return this;
  },

  getCurrentUser: function() {
    return this._currentUser && this._currentUser !== true
      ? this._currentUser
      : null;
  },

  getAuthenticationError: function() {
    return this._authError && this._authError !== true
      ? this._authError
      : null;
  },

  authenticationFailed: function() {
    return !!this._authError && !!this._authError.code
      && this._authError.code === 401
      && this._authError.error === 'authentification failed';
  },

  isAuthenticated: function() {
    return typeof(this._currentUser) === 'object' && !!this._currentUser
      && !this._currentUser.error;
  },

  getAuthProviders: function() {
    return this._authProviders && this._authProviders !== true
      ? this._authProviders
      : null;
  },

  _requireLoginHandler: function() {
    if (!this.isAuthenticated())
      this._fetchCurrentUser();
    else
      this.trigger(this);
  },

  _fetchCurrentUser: function() {
    if (this._authError === true)
      return false;

    if (this._authError)
      return this.trigger(this);

    this._authError = true;

    return jquery.get(
      '/api/user/me',
      (data) => {
        this._currentUser = data.user;
        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._authError = { code: xhr.status };
      if (xhr.responseJSON) {
        this._authError.error = xhr.responseJSON.error;
        this._authError.message = xhr.responseJSON.message;
      }
      this.trigger(this);
    });
  },

  _fetchAuthProviders: function() {
    if (this._authProviders === true)
      return false;

    if (this._authProviders)
      return this.trigger(this);

    this._authProviders = true;

    return jquery.get(
      '/api/auth/providers',
      (data) => {
        this._authProviders = data.providers;
        this.trigger(this);
      }
    ).error((xhr, voteStatus, err) => {
      this._authProviders = {error: xhr.status};
      this.trigger(this);
    });
  },

  _routeChangeHandler: function(history, location, action) {
    if (!!location.query.user && !!location.query.appId) {
      if (this._jwt !== location.query.user || this._appId !== location.query.appId) {
        this._jwt = location.query.user;
        this._appId = location.query.appId;
        this._fetchCurrentUser();
      }
    } else if (!!this._jwt || !!this._appId) {
      this._currentUser = null;
      this._authError = null;
      this._jwt = null;
      this._appId = null;
      this.trigger(this);
    }
  },

  _ajaxPrefilter: function(options, originalOptions, jqXHR) {
    if (!!this._jwt && !!this._appId) {
      jqXHR.setRequestHeader('Authorization', 'JWT ' + this._jwt);
      jqXHR.setRequestHeader('Cocorico-App-Id', this._appId);
    }
  },

  _ajaxError: function(event, request, settings) {
    if (request.status === 401) {
      // If we get a 401 and the user is logged in using JWT, the JWT is
      // invalid. It can happen at anytime since we support the "exp"
      // (expiration time) field. When it happens, we make sure the user is
      // marked as logged out.
      if (!!this._jwt && !!this._appId) {
        this._currentUser = null;
        this._jwt = null;
        this._appId = null;
        this.trigger(this);
      }
    }
  },
});
