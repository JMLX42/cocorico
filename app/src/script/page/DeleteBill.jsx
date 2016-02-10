var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillStore = require("../store/BillStore");

var BillAction = require("../action/BillAction");

var BillLink = require("../component/BillLink");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar;

var Link = ReactRouter.Link;

var EditBill = React.createClass({

    mixins: [
        Reflux.connect(BillStore, 'bills'),
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillReceiveProps: function(props)
    {
        BillAction.show(props.params.billId);
    },

    componentDidMount: function()
    {
        BillAction.show(this.props.params.billId);
    },

    deleteClickHandler: function(event)
    {
        BillAction.delete(this.props.params.billId);
    },

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        var bill = this.state && this.state.bills
            ? this.state.bills.getById(this.props.params.billId)
            : null;

        if (!bill)
            return null;

		return (
            <div className="page page-delete-bill">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <p>
                                Êtes-vous sûr de vouloir supprimer le bille "
                                    <BillLink billId={bill.id}/>
                                " ?
                                <br />
                                Cette opération ne pourra pas être annulée !
                            </p>
                            <ButtonToolbar className="bill-center">
                                <Button bsStyle="danger" bsSize="large" onClick={this.deleteClickHandler}>Supprimer</Button>
                                <Button bsSize="large">Annuler</Button>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = EditBill;
