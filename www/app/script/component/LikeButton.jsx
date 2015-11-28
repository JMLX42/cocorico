var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var Button = ReactBootstrap.Button;

var LikeButton = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin
    ],

    render: function()
    {
		return (
            <Button bsSize="small" className="btn-like" onClick={this.props.onClick}>
                J'approuve ({this.props.count})
            </Button>
		);
	}
});

module.exports = LikeButton;
