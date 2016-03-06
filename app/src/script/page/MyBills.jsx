var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactDocumentTitle = require('react-document-title');

var BillAction = require("../action/BillAction");
var BillStore = require("../store/BillStore"),
    ConfigStore = require("../store/ConfigStore");

var BillList = require("../component/BillList");

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab;

var Link = ReactRouter.Link;

var MyBills = React.createClass({

    mixins: [
        Reflux.connect(BillStore, 'bills'),
        Reflux.connect(ConfigStore, 'config'),
        Reflux.ListenerMixin,
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        BillAction.listCurrentUserBills();

        this.listenTo(BillAction.changeStatus, this.billStatusChangedHandler);
    },

    billStatusChangedHandler: function(billId, state)
    {
        this.setState({activeKey : this.getTabKeyBySlug(state)});
    },

    getInitialState: function()
    {
        return {
            activeKey : 1
        };
    },

    getTabSlugs: function()
    {
        return [
            'draft',
            'review',
            'debate',
            'vote',
            'published'
        ];
    },

    getTabKeyBySlug: function(slug)
    {
        return this.getTabSlugs().indexOf(slug) + 1;
    },

    tabSelectHandler: function(key)
    {
        this.setState({ activeKey : key });
    },

	render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        var bills = this.state.bills
            ? this.state.bills.getCurrentUserBills()
            : null;

        if (!bills)
          return null;

        var filteredBills = {};
        for (var bill of bills)
            if (filteredBills[bill.status])
                filteredBills[bill.status].push(bill);
            else
                filteredBills[bill.status] = [bill];

		return (
            <ReactDocumentTitle title={this.getIntlMessage('page.myBills.TITLE') + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="page page-my-bills">
                    <Grid>
                        <Row>
                            <Col md={10}>
                                <h1>{this.getIntlMessage('page.myBills.TITLE')}</h1>
                            </Col>
                            {this.state.config.capabilities.bill.create
                                ? <Col md={2}>
                                    <Link to={this.getIntlMessage('route.CREATE_BILL')} className="pull-right">
                                        <Button bsSize="large" bsStyle="primary" className="btn-create-bill">
                                            {this.getIntlMessage('page.myBills.NEW_BILL')}
                                        </Button>
                                    </Link>
                                </Col>
                                : <span/>}
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Tabs activeKey={this.state.activeKey} onSelect={this.tabSelectHandler} className="tabs-my-bills">
                                    {this.state.config.capabilities.step.draft
                                        ? <Tab eventKey={1} title={"Brouillon (" + (filteredBills['draft'] || []).length + ")"}>
                                            <BillList bills={filteredBills['draft']} showLikeButtons={false} editable={true}/>
                                        </Tab>
                                        : <div/>}
                                    {this.state.config.capabilities.step.review
                                        ? <Tab eventKey={2} title={"Révision (" + (filteredBills['review'] || []).length + ")"}>
                                            <BillList bills={filteredBills['review']} showLikeButtons={false} editable={['bill-status']} />
                                        </Tab>
                                        : <div/>}
                                    {this.state.config.capabilities.step.debate
                                        ? <Tab eventKey={3} title={"Débat (" + (filteredBills['debate'] || []).length + ")"}>
                                            <BillList bills={filteredBills['debate']} showLikeButtons={false} editable={['bill-status']} />
                                        </Tab>
                                        : <div/>}
                                    {this.state.config.capabilities.step.vote
                                        ? <Tab eventKey={4} title={"Vote (" + (filteredBills['vote'] || []).length + ")"}>
                                            <BillList bills={filteredBills['vote']} showLikeButtons={false} editable={['bill-status']} />
                                        </Tab>
                                        : <div/>}
                                    {this.state.config.capabilities.step.published
                                        ? <Tab eventKey={5} title={"Publié (" + (filteredBills['published'] || []).length + ")"}>
                                            <BillList bills={filteredBills['published']} showLikeButtons={false} editable={['bill-status']} />
                                        </Tab>
                                        : <div/>}
                                </Tabs>
                            </Col>
                        </Row>

                    </Grid>
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = MyBills;
