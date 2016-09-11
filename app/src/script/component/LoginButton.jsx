var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var RouteAction = require('../action/RouteAction');

var Link = ReactRouter.Link;

var Glyphicon = ReactBootstrap.Glyphicon

var LoginButton = React.createClass({

    mixins: [
        Reflux.ListenerMixin,
        ReactIntl.IntlMixin
    ],

    contextTypes: {
        location: React.PropTypes.object
    },

    componentWillMount: function()
    {
        this._routeChangeUnsub = this.listenTo(RouteAction.change, (history, location) => {
            this.setState({
                path: location.pathname
            });
        });

        // http://stackoverflow.com/questions/7131909/facebook-callback-appends-to-return-url
        if (window.location.hash == '#_=_')
            history.replaceState
                ? history.replaceState(null, null, window.location.href.split('#')[0])
                : window.location.hash = '';
    },

    componentWillUnmount: function()
    {
        if (this._routeChangeUnsub) {
            this._routeChangeUnsub();
        }
    },

    getInitialState: function()
    {
        return {
            path: this.context.location.pathname
        }
    },

    render: function()
    {
        var link = this.getIntlMessage('route.SIGN_IN');

        if (this.state.path != '/' && this.getIntlMessage('route.SIGN_IN') != this.state.path)
            link += '?redirect=' + encodeURIComponent(this.state.path)

		return (
            <Link to={link} activeClassName="active">
                {this.getIntlMessage('login.SIGN_IN')}
            </Link>
		);
	}
});

module.exports = LoginButton;
