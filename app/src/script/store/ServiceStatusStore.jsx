var Reflux = require('reflux')
var ServiceStatusAction = require('../action/ServiceStatusAction');
var jquery = require('jquery');

module.exports = Reflux.createStore({
  init: function() {
    this.listenTo(ServiceStatusAction.showStatus, this.fetchStatus);
    this.listenTo(ServiceStatusAction.updateStatus, this.fetchStatus);

    this._system = {};
    this._capabilities = {};
  },

  getSystemStatus: function() {
    return this._system;
  },

  getSystemCapabilities: function() {
    return this._capabilities;
  },

  fetchStatus: function() {
    jquery.get(
      '/api/service/status',
      (data) => {
        this._system = data.system;
        this._capabilities = data.capabilities;
        this.trigger(this);
      }
    );
  },
});
