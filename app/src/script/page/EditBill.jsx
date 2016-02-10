var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillStore = require("../store/BillStore");

var BillAction = require("../action/BillAction");

var BillEditor = require("../component/BillEditor");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var EditBill = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    getInitialState: function()
    {
        return {billId: null};
    },

    componentWillReceiveProps: function(props)
    {
        this.setState({billId: props.params.billId});
    },

    componentDidMount: function()
    {
        this.setState({billId: this.props.params.billId});
    },

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        if (!this.state.billId)
            return null;

		return (
            <ReactDocumentTitle title={this.getIntlMessage('page.editBill.TITLE') + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="page page-create-bill">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <h1>{this.getIntlMessage('page.editBill.TITLE')}</h1>
                            </Col>
                        </Row>
                    </Grid>

                    <BillEditor billId={this.state.billId}/>
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = EditBill;
