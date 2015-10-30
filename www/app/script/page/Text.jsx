var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var TextComponent = require('../component/Text');

var Text = React.createClass({

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
            <TextComponent slug={this.state.slug} />
		);
	}
});

module.exports = Text;
