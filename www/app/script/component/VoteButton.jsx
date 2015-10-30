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
        TextAction.vote(this.props.text, this.props.value);
    },

    render: function()
    {
		return (
            <Button bsSize="large"
                    className={this.props.className}
                    onClick={this.handleClick}>
                <FormattedMessage message={this.getIntlMessage('text.VOTE')}
                                  value={this.getIntlMessage(this.props.message)}/>
            </Button>
		);
	}
});

module.exports = VoteButton;
