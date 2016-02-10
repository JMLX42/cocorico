var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Bill = require('../component/Bill');

var ViewBill = React.createClass({

    getInitialState: function()
    {
        return {
            billId: null,
            tab: null
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        this.setState({
            billId : nextProps.params.billId,
            tab: nextProps.params.tab
        });
    },

    componentDidMount: function()
    {
        this.setState({
            billId : this.props.params.billId,
            tab: this.props.params.tab
        });
    },

    render: function()
    {
        if (!this.state.billId)
            return null;

		return (
            <Bill billId={this.state.billId} tab={this.state.tab}/>
		);
	}
});

module.exports = ViewBill;
