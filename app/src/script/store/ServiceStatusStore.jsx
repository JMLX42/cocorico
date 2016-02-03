var Reflux = require('reflux')
var ServiceStatusAction = require("../action/ServiceStatusAction");
var jquery = require('jquery');

module.exports = Reflux.createStore({
    init: function()
    {
        this.listenTo(ServiceStatusAction.showStatus, this.fetchStatus);
        this.listenTo(ServiceStatusAction.updateStatus, this.fetchStatus);

        this._status = {};
    },

    getInitialState: function()
    {
        return this;
    },

    getStatus: function()
    {
        return this._status;
    },

    fetchStatus: function()
    {
        jquery.get(
            '/api/service/status',
            (data) => {
                this._status = data.status;
                this.trigger(this);
            }
        );
    }
});
