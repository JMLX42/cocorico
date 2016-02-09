var React = require('react');
var ReactIntl = require('react-intl');
var classNames = require('classnames');

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
            dislikeButtonEnabled: true,
            editable: true,
            scoreFormat: (score) => '(' + (score > 0 ? '+' + score : score) + ')'
        };
    },

    displayLikeButton: function()
    {
        return this.isAuthenticated() && this.props.likeButtonEnabled
            && (this.props.editable || (this.props.resource.likes.length && this.props.resource.likes[0].value));
    },

    displayDislikeButton: function()
    {
        return this.isAuthenticated() && this.props.dislikeButtonEnabled
            && (this.props.editable || (this.props.resource.likes.length && !this.props.resource.likes[0].value));
    },

    render: function()
    {
        return (
            <span style={{display:'inline-block'}} className={classNames({
                    'like-buttons' : true,
                    'like-buttons-active' : this.props.resource.likes.length > 0
                })}>
                {this.displayLikeButton()
                    ? <span className={this.getLikeIconClassNames(true)}
                        title={this.getIntlMessage('text.LIKE_BUTTON_TITLE')}
                        onClick={(e)=>this.props.editable && this.props.likeAction(this.props.resource, true)}/>
                    : <span/>}
                {this.displayDislikeButton()
                    ? <span className={this.getLikeIconClassNames(false)}
                        title={this.getIntlMessage('text.DISLIKE_BUTTON_TITLE')}
                        onClick={(e)=>this.props.editable && this.props.likeAction(this.props.resource, false)}/>
                    : <span/>}
                <span className="like-score">{this.props.scoreFormat(this.props.resource.score)}</span>
            </span>
        );
	}
});

module.exports = LikeButtons;
