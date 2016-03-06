var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var BillAction = require("../action/BillAction");

var BillStore = require("../store/BillStore"),
    ConfigStore = require("../store/ConfigStore");

var BillLink = require("../component/BillLink"),
    BillStatusSelect = require("../component/BillStatusSelect");

var LikeButtons = require('./LikeButtons');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var BillList = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(ConfigStore, 'config')
    ],

    editable: function(feature)
    {
        return this.props.editable === true || !feature
            || Array.isArray(this.props.editable) && this.props.editable.indexOf(feature) >= 0;
    },

	render: function()
    {
        var bills = this.props.bills || [];

        var filteredBills = bills.filter((bill) => {
            return !this.props.filterFunction || this.props.filterFunction(bill)
        });

		return (
            <div>
                <ul className="list-unstyled bill-list">
                    {filteredBills.length == 0
                        ? <li>{this.getIntlMessage('page.myBills.NO_BILL')}</li>
                        : filteredBills.map((bill) => {
                            return (
                                <li key={bill.id}>
                                    <BillLink bill={bill}/>
                                    {this.props.showLikeButtons
                                        ? <LikeButtons likeAction={BillAction.like} resource={bill}/>
                                        : <span/>}
                                    {this.editable('bill-content') && this.state.config.capabilities.bill.edit
                                        ? <Link to={this.getIntlMessage('route.EDIT_BILL') + '/' + bill.id + '/' + bill.slug} className="pull-right">Modifier</Link>
                                        : ''}
                                    {this.editable('bill-status') && this.state.config.capabilities.bill.edit
                                        ? <BillStatusSelect bill={bill} className="pull-right"/>
                                        : ''}
                                </li>
                            );}
                        )
                    }
    			</ul>
            </div>
		);
	}
});

module.exports = BillList;
