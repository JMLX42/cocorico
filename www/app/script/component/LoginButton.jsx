var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var ReactBootstrap = require('react-bootstrap');

var Link = ReactRouter.Link;

var Glyphicon = ReactBootstrap.Glyphicon

var LoginButton = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    contextTypes: {
        location: React.PropTypes.object
    },

    getInitialState: function()
    {
        return {
            path: this.context.location.pathname
        }
    },

    shouldComponentUpdate: function()
    {
        return this.state.path != this.context.location.pathname;
    },

    componentWillReceiveProps: function(props)
    {
        this.setState({
            path: this.context.location.pathname
        });
    },

    render: function()
    {
        var link = this.getIntlMessage('route.SIGN_IN');

        if (this.state.path != '/' && this.getIntlMessage('route.SIGN_IN') != this.state.path)
            link += '/' + encodeURIComponent('/#' + this.state.path)

		return (
            <Link to={link}>
                {this.getIntlMessage('login.SIGN_IN')}
            </Link>
		);
	}
});

module.exports = LoginButton;
