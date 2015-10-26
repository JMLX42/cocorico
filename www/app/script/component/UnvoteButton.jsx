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
        PollAction.unvote(this.props.poll.id);

        return false;
    },

    render: function()
    {
		return (
            <Button onClick={this.handleClick} className="btn-unvote">
                <FormattedMessage message={this.getIntlMessage('poll.UNVOTE')}/>
            </Button>
		);
	}
});

module.exports = VoteButton;
