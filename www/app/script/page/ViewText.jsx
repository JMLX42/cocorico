var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Text = require('../component/Text');

var ViewText = React.createClass({

    getInitialState: function()
    {
        return {slug: null};
    },

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
        if (!this.state.slug)
            return null;

		return (
            <Text slug={this.state.slug} />
		);
	}
});

module.exports = ViewText;
