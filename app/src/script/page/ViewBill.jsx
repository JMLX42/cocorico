var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var Bill = require('../component/Bill');

var BillAction = require('../action/BillAction');

var BillStore = require('../store/BillStore');

var ViewBill = React.createClass({

    mixins: [Reflux.connect(BillStore, 'bills')],

    getInitialState: function()
    {
        return {
            billSlug: null,
            tab: null
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        this.setState({
            billSlug : nextProps.params.billSlug,
            tab: nextProps.params.tab
        });
        if (nextProps.params.billSlug)
            BillAction.showBySlug(nextProps.params.billSlug);
    },

    componentDidMount: function()
    {
        this.setState({
            billSlug : this.props.params.billSlug,
            tab: this.props.params.tab
        });
        if (this.props.params.billSlug)
            BillAction.showBySlug(this.props.params.billSlug);
    },

    render: function()
    {
        if (!this.state.billSlug)
            return null;

        var bill = this.state.bills.getBySlug(this.state.billSlug);

        if (!bill)
            return null;

		return (
            <Bill bill={bill} tab={this.state.tab}/>
		);
	}
});

module.exports = ViewBill;
