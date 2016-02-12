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
            billSlug : nextProps.params.billSlug,
            tab: nextProps.params.tab
        });
    },

    componentDidMount: function()
    {
        this.setState({
            billId : this.props.params.billId,
            billSlug : this.props.params.billSlug,
            tab: this.props.params.tab
        });
    },

    render: function()
    {
        if (!this.state.billId)
            return null;

		return (
            <Bill billId={this.state.billId} slug={this.state.billSlug} tab={this.state.tab}/>
		);
	}
});

module.exports = ViewBill;
