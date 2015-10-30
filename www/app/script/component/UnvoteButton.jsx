var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var TextAction = require('../action/TextAction');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var VoteButton = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    handleClick: function()
    {
        TextAction.unvote(this.props.text.id);

        return false;
    },

    render: function()
    {
		return (
            <Button onClick={this.handleClick} className="btn-unvote">
                <FormattedMessage message={this.getIntlMessage('text.UNVOTE')}/>
            </Button>
		);
	}
});

module.exports = VoteButton;
