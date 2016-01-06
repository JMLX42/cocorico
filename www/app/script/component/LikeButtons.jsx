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

    getDefaultProps: function()
    {
        return {
            likeButtonEnabled: true,
            dislikeButtonEnabled: true
        };
    },

    render: function()
    {
        return (
            <span style={{display:'inline-block'}}>
                {this.isAuthenticated()
                    ? <span>
                        {this.props.likeButtonEnabled
                            ? <span className={this.getLikeIconClassNames(true)}
                                title={this.getIntlMessage('text.LIKE_BUTTON_TITLE')}
                                onClick={(e)=>this.props.likeAction(this.props.resource.id, true)}/>
                            : <span/>}
                        {this.props.dislikeButtonEnabled
                            ? <span className={this.getLikeIconClassNames(false)}
                                title={this.getIntlMessage('text.DISLIKE_BUTTON_TITLE')}
                                onClick={(e)=>this.props.likeAction(this.props.resource.id, false)}/>
                            : <span/>}
                    </span>
                    : <span/>}
                <span className="like-score">({this.props.resource.score})</span>
            </span>
        );
	}
});

module.exports = LikeButtons;
