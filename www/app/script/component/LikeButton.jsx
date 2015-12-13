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
            <span className={(this.props.dislike ? 'icon-thumb_down' : 'icon-thumb_up') + ' icon-btn'}></span>
		);
	}
});

module.exports = LikeButton;
