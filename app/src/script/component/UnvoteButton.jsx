var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var VoteAction = require('../action/VoteAction');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var UnvoteButton = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    handleClick: function()
    {
        VoteAction.unvote(this.props.bill.id);

        return false;
    },

    render: function()
    {
		return (
            <Button onClick={this.handleClick} className="btn-unvote">
                <FormattedMessage message={this.getIntlMessage('vote.UNVOTE')}/>
            </Button>
		);
	}
});

module.exports = UnvoteButton;
