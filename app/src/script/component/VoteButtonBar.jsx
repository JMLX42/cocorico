var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var classNames = require('classnames');

var FormattedMessage = ReactIntl.FormattedMessage;

var ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Button = ReactBootstrap.Button;

var VoteButtonBar = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function() {
        return {
            onVote: (e, ballotValue) => null
        };
    },

    render: function() {
        return (
            <ButtonToolbar className="vote-step-actions">
                <Button className="btn-vote btn-positive"
                    onClick={(e)=>this.props.onVote(e, 0)}>
                    <span className="icon-thumb_up"/>
                    <FormattedMessage
                        message={this.getIntlMessage('vote.I_VOTE')}
                        value={this.getIntlMessage('vote.VOTE_YES')}/>
                </Button>
                <Button className="btn-vote btn-neutral"
                    onClick={(e)=>this.props.onVote(e, 1)}>
                    <span className="icon-stop"/>
                    <FormattedMessage
                        message={this.getIntlMessage('vote.I_VOTE')}
                        value={this.getIntlMessage('vote.VOTE_BLANK')}/>
                </Button>
                <Button className="btn-vote btn-negative"
                    onClick={(e)=>this.props.onVote(e, 2)}>
                    <span className="icon-thumb_down"/>
                    <FormattedMessage
                        message={this.getIntlMessage('vote.I_VOTE')}
                        value={this.getIntlMessage('vote.VOTE_NO')}/>
                </Button>
            </ButtonToolbar>
        );
    }
});

module.exports = VoteButtonBar;
