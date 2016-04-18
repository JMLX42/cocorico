var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillStore = require("../store/BillStore");

var BillAction = require("../action/BillAction");

var BillList = require("../component/BillList"),
    Page = require("../component/Page"),
    PageTitle = require("../component/PageTitle");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Home = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(BillStore, 'bills'),
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        BillAction.showLatestBills();
    },

    render: function()
    {
		return (
            <div className="page page-home">
                <Page slug="accueil" setDocumentTitle={true}/>
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h2>{this.getIntlMessage('bill.BILLS')}</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {this.state && this.state.bills
                                ? <BillList bills={this.state.bills.getLatestBills()} />
                                : <div/>}
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Home;
