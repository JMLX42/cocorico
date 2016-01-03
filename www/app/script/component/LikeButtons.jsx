var React = require('react');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var LikeButtons = React.createClass({

    mixins: [
        ForceAuthMixin
    ],

    getLikeIconClassNames: function(value)
    {
        if (value)
            return 'icon-thumb_up icon-btn'
                + (this.props.resource.likes.length && this.props.resource.likes[0].value
                    ? ' icon-btn-active'
                    : '');

        return 'icon-thumb_down icon-btn'
            + (this.props.resource.likes.length && !this.props.resource.likes[0].value
                ? ' icon-btn-active'
                : '')
    },

    render: function()
    {
        return (
            <span>
                <span className={this.getLikeIconClassNames(true)}
                    onClick={(e)=>this.props.likeAction(this.props.resource.id, true)}></span>
                <span className={this.getLikeIconClassNames(false)}
                    onClick={(e)=>this.props.likeAction(this.props.resource.id, false)}></span>
                <span className="like-score">({this.props.resource.score})</span>
            </span>
        );
	}
});

module.exports = LikeButtons;
