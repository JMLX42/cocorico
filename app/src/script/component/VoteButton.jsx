var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteAction = require('../action/VoteAction');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var VoteButton = React.createClass({
    mixins: [
        ReactIntl.IntlMixin,
        Reflux.ListenerMixin
    ],

    getInitialState: function()
    {
        return {
            disabled : false
        };
    },

    componentWillMount: function()
    {
        this.listenTo(VoteAction.vote, (billId) => {
            this.setState({disabled : true});
        });
    },

    handleClick: function()
    {
        VoteAction.vote(this.props.bill, this.props.value);
    },

    render: function()
    {
		return (
            <Button bsSize="large"
                    className={this.props.className}
                    disabled ={this.state.disabled}
                    onClick={this.handleClick}>
                <FormattedMessage message={this.getIntlMessage('bill.VOTE')}
                                  value={this.getIntlMessage(this.props.message)}/>
            </Button>
		);
	}
});

module.exports = VoteButton;
