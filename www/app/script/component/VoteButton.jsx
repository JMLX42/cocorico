var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var PollAction = require('../action/PollAction');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var VoteButton = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    handleClick: function()
    {
        PollAction.vote(this.props.poll, this.props.value);
    },

    render: function()
    {
		return (
            <Button bsSize="large"
                    className={this.props.className}
                    onClick={this.handleClick}>
                <FormattedMessage message={this.getIntlMessage('poll.VOTE')}
                                  value={this.getIntlMessage(this.props.text)}/>
            </Button>
		);
	}
});

module.exports = VoteButton;
