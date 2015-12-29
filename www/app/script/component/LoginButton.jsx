var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var ReactBootstrap = require('react-bootstrap');

var Link = ReactRouter.Link;

var Glyphicon = ReactBootstrap.Glyphicon

var LoginButton = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <Link to={this.getIntlMessage('route.SIGN_IN') + '/' + encodeURIComponent('/' + location.hash)}>
                {this.getIntlMessage('login.SIGN_IN')}
            </Link>
		);
	}
});

module.exports = LoginButton;
