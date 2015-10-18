var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Button = ReactBootstrap.Button;

var VoteButton = React.createClass({
    render: function()
    {
		return (
            <Button bsSize="large" className={this.props.className}>
                {this.props.text}
            </Button>
		);
	}
});

module.exports = VoteButton;
