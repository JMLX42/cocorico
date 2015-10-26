var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var PollComponent = require('../component/Poll');

var Poll = React.createClass({

    componentWillReceiveProps: function(props)
    {
        this.setState({'slug': props.params.slug});
    },

    componentDidMount: function()
    {
        this.setState({'slug': this.props.params.slug});
    },

    render: function()
    {
        if (!this.state || !this.state.slug)
            return null;

		return (
            <PollComponent slug={this.state.slug} />
		);
	}
});

module.exports = Poll;
