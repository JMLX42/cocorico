var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillAction = require('../action/BillAction');

var ArgumentTab = require('./ArgumentTab'),
    SourceTab = require('./SourceTab');

var SourceStore = require('../store/SourceStore'),
    ArgumentStore = require('../store/ArgumentStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab,
    Button = ReactBootstrap.Button,
    Accordion = ReactBootstrap.Accordion,
    Panel = ReactBootstrap.Panel;

var Bill = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(SourceStore, 'sources'),
        Reflux.connect(ArgumentStore, 'args')
    ],

    contextTypes: {
        history: React.PropTypes.object,
        location: React.PropTypes.object
    },

    getInitialState: function()
    {
        return {
            activeKey : this.props.tab ? this.getTabKeyBySlug(this.props.tab) : 1
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        // this.setState({ activeKey : this.getTabKeyBySlug(nextProps.tab) });
    },

    componentWillMount: function()
    {
        // this.context.history.key = this.getTabSlugByKey(this.state.activeKey);
    },

    getTabSlugs: function()
    {
        var slugs = [
            this.getIntlMessage('route.VIEW_BILL_TAB_ARGUMENTS'),
            this.getIntlMessage('route.VIEW_BILL_TAB_SOURCES'),
            this.getIntlMessage('route.VIEW_BILL_TAB_PROPOSITIONS')
        ];

        if (this.props.bill.status != 'debate'
            && this.props.bill.status != 'vote'
            && this.props.bill.status != 'published')
        {
            slugs.shift();
        }

        return slugs;
    },

    getTabKeyBySlug: function(slug)
    {
        return this.getTabSlugs().indexOf(slug) + 1;
    },

    getTabSlugByKey: function(key)
    {
        return this.getTabSlugs()[key - 1];
    },

    tabSelectHandler: function(key)
    {
        this.context.history.replace(
            this.getIntlMessage('route.VIEW_BILL')
            + '/' + this.props.bill.id
            + '/' + this.props.bill.slug
            + '/' + this.getTabSlugByKey(key)
        );

        this.setState({ activeKey : key });
    },

    renderTabs: function()
    {
        var bill = this.props.bill;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByBillId(bill.id)
            : null;

        var args = this.state.args
            ? this.state.args.getArgumentsByBillId(this.props.bill.id)
            : null;

        var eventKey = 1;

        return (
            <Tabs animation={false} activeKey={this.state.activeKey} onSelect={this.tabSelectHandler} className="hidden-xs">
                {bill.status == 'debate' || bill.status == 'vote' || bill.status == 'published'
                    ? <Tab eventKey={eventKey++} title={'Arguments (' + (args ? args.length : 0) + ')'}>
                        <ArgumentTab bill={bill} editable={this.props.editable && bill.status == 'debate'}/>
                    </Tab>
                    : <div/>}
                <Tab eventKey={eventKey++} title={'Sources (' + (sources ? sources.length : 0) + ')'}>
                    <SourceTab bill={bill} editable={this.props.editable && bill.status == 'review'}/>
                </Tab>
                <Tab eventKey={eventKey++} title="Propositions (0)">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <p>{this.getIntlMessage('bill.NO_PROPOSAL')}</p>
                                {this.props.editable && bill.status == 'review'
                                    ? !this.isAuthenticated()
                                        ? <p className="hint">
                                            {this.renderLoginMessage(this.getIntlMessage('bill.ADD_PROPOSAL_LOGIN'))}
                                        </p>
                                        : <Button bsStyle="primary">
                                            {this.getIntlMessage('bill.ADD_PROPOSAL')}
                                        </Button>
                                    : <div/>}
                            </Col>
                        </Row>
                    </Grid>
                </Tab>
            </Tabs>
        );
    },

    renderAccordion: function()
    {
        var bill = this.props.bill;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByBillId(bill.id)
            : null;

        var eventKey = 1;

        return (
            <Accordion className="hidden-sm hidden-md hidden-lg"
                activeKey={this.state.activeKey}
                onSelect={this.tabSelectHandler}>
                {bill.status == 'debate' || bill.status == 'vote' || bill.status == 'published'
                    ? <Panel eventKey={eventKey++} header="Arguments (0)">
                        <ArgumentTab bill={bill} editable={this.props.editable && bill.status == 'debate'}/>
                    </Panel>
                    : <div/>}
                <Panel eventKey={eventKey++} header={'Sources (' + (sources ? sources.length : 0) + ')'}>
                    <SourceTab bill={bill} editable={this.props.editable && bill.status == 'review'}/>
                </Panel>
                <Panel eventKey={eventKey++} header="Propositions (0)">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <p>{this.getIntlMessage('bill.NO_PROPOSAL')}</p>
                                {this.props.editable && bill.status == 'review'
                                    ? !this.isAuthenticated()
                                        ? <p className="hint">
                                            {this.renderLoginMessage(this.getIntlMessage('bill.ADD_PROPOSAL_LOGIN'))}
                                        </p>
                                        : <Button bsStyle="primary">
                                            {this.getIntlMessage('bill.ADD_PROPOSAL')}
                                        </Button>
                                    : <div/>}
                            </Col>
                        </Row>
                    </Grid>
                </Panel>
            </Accordion>
        );
    },

    render: function()
    {
        return (
            <div>
                {this.renderTabs()}
                {this.renderAccordion()}
            </div>
        );
    }
});

module.exports = Bill;
