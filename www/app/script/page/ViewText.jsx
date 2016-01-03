var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Text = require('../component/Text');

var ViewText = React.createClass({

    getInitialState: function()
    {
        return {textId: null};
    },

    componentWillReceiveProps: function(props)
    {
        this.setState({textId : props.params.textId});
    },

    componentDidMount: function()
    {
        this.setState({textId : this.props.params.textId});
    },

    render: function()
    {
        if (!this.state.textId)
            return null;

		return (
            <Text textId={this.state.textId} tab={this.props.routeParams.tab}/>
		);
	}
});

module.exports = ViewText;
