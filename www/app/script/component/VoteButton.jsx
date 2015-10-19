var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Button = ReactBootstrap.Button;

var VoteButton = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <Button bsSize="large" className={this.props.className}>
                {this.getIntlMessage(this.props.text)}
            </Button>
		);
	}
});

module.exports = VoteButton;
