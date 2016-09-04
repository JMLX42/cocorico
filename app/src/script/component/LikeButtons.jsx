var React = require('react');
var ReactIntl = require('react-intl');
var classNames = require('classnames');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var LikeButtons = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    getDefaultProps: function()
    {
        return {
            likeButtonEnabled: true,
            dislikeButtonEnabled: true,
            showScore: true,
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
                    'like-buttons-active' : this.props.resource.likes.length > 0,
                    'like-buttons-editable' : this.props.editable
                })}>
                {this.displayLikeButton()
                    ? <span className={classNames({
                            'icon-thumb_up' : true,
                            'icon-btn-active' : this.props.resource.likes.length && this.props.resource.likes[0].value,
                            'icon-btn' : this.props.editable
                        })}
                        onClick={(e)=>this.props.editable && this.props.likeAction(this.props.resource, true)}/>
                    : <span/>}
                {this.displayDislikeButton()
                    ? <span className={classNames({
                            'icon-thumb_down' : true,
                            'icon-btn-active' : this.props.resource.likes.length && !this.props.resource.likes[0].value,
                            'icon-btn' : this.props.editable
                        })}
                        onClick={(e)=>this.props.editable && this.props.likeAction(this.props.resource, false)}/>
                    : <span/>}
                {this.props.showScore
                    ? <span className="like-score">{this.props.scoreFormat(this.props.resource.score)}</span>
                    : <span/>}
            </span>
        );
	}
});

module.exports = LikeButtons;
