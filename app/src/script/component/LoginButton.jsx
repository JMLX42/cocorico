var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var ReactBootstrap = require('react-bootstrap');

var Link = ReactRouter.Link;

var Glyphicon = ReactBootstrap.Glyphicon

var LoginButton = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    contextTypes: {
        location: React.PropTypes.object,
        history: React.PropTypes.object
    },

    componentWillMount: function()
    {
        this._historyListener = this.context.history.listenBefore(this.onTransition);
    },

    componentWillUnmount: function()
    {
        this._historyListener();
    },

    getInitialState: function()
    {
        return {
            path: this.context.location.pathname
        }
    },

    onTransition: function(location)
    {
        this.setState({
            path: location.pathname
        });
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
