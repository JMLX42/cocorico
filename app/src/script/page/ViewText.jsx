var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Text = require('../component/Text');

var ViewText = React.createClass({

    getInitialState: function()
    {
        return {
            textId: null,
            tab: null
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        this.setState({
            textId : nextProps.params.textId,
            tab: nextProps.params.tab
        });
    },

    componentDidMount: function()
    {
        this.setState({
            textId : this.props.params.textId,
            tab: this.props.params.tab
        });
    },

    render: function()
    {
        if (!this.state.textId)
            return null;

		return (
            <Text textId={this.state.textId} tab={this.state.tab}/>
		);
	}
});

module.exports = ViewText;
