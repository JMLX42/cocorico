var React = require('react');
var ReactIntl = require('react-intl');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var LikeButtons = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
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
                {this.isAuthenticated()
                    ? <span>
                        <span className={this.getLikeIconClassNames(true)}
                            title={this.getIntlMessage('text.LIKE_BUTTON_TITLE')}
                            onClick={(e)=>this.props.likeAction(this.props.resource.id, true)}></span>
                        <span className={this.getLikeIconClassNames(false)}
                            title={this.getIntlMessage('text.DISLIKE_BUTTON_TITLE')}
                            onClick={(e)=>this.props.likeAction(this.props.resource.id, false)}></span>
                    </span>
                    : <span/>}
                <span className="like-score">({this.props.resource.score})</span>
            </span>
        );
	}
});

module.exports = LikeButtons;
