var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextAction = require('../action/TextAction');

var ArgumentTab = require('./ArgumentTab'),
    SourceTab = require('./SourceTab');

var SourceStore = require('../store/SourceStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab,
    Button = ReactBootstrap.Button,
    Accordion = ReactBootstrap.Accordion,
    Panel = ReactBootstrap.Panel;

var Text = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(SourceStore, 'sources')
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
            this.getIntlMessage('route.VIEW_TEXT_TAB_ARGUMENTS'),
            this.getIntlMessage('route.VIEW_TEXT_TAB_SOURCES'),
            this.getIntlMessage('route.VIEW_TEXT_TAB_PROPOSITIONS')
        ];

        if (this.props.text.status != 'debate'
            && this.props.text.status != 'vote'
            && this.props.text.status != 'published')
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
            this.getIntlMessage('route.VIEW_TEXT')
            + '/' + this.props.text.id
            + '/' + this.props.text.slug
            + '/' + this.getTabSlugByKey(key)
        );

        this.setState({ activeKey : key });
    },

    renderTabs: function()
    {
        var text = this.props.text;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByTextId(text.id)
            : null;

        var eventKey = 1;

        return (
            <Tabs animation={false} activeKey={this.state.activeKey} onSelect={this.tabSelectHandler} className="hidden-xs">
                {text.status == 'debate' || text.status == 'vote' || text.status == 'published'
                    ? <Tab eventKey={eventKey++} title="Arguments (0)">
                        <ArgumentTab text={text} editable={this.props.editable && text.status == 'debate'}/>
                    </Tab>
                    : <div/>}
                <Tab eventKey={eventKey++} title={'Sources (' + (sources ? sources.length : 0) + ')'}>
                    <SourceTab text={text} editable={this.props.editable && text.status == 'review'}/>
                </Tab>
                <Tab eventKey={eventKey++} title="Propositions (0)">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <p>{this.getIntlMessage('text.NO_PROPOSAL')}</p>
                                {this.props.editable && text.status == 'review'
                                    ? !this.isAuthenticated()
                                        ? <p className="hint">
                                            {this.renderLoginMessage(this.getIntlMessage('text.ADD_PROPOSAL_LOGIN'))}
                                        </p>
                                        : <Button bsStyle="primary">
                                            {this.getIntlMessage('text.ADD_PROPOSAL')}
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
        var text = this.props.text;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByTextId(text.id)
            : null;

        var eventKey = 1;

        return (
            <Accordion className="hidden-sm hidden-md hidden-lg"
                activeKey={this.props.tab ? this.state.activeKey : undefined}
                onSelect={this.tabSelectHandler}>
                {text.status == 'debate' || text.status == 'vote' || text.status == 'published'
                    ? <Panel eventKey={eventKey++} header="Arguments (0)">
                        <ArgumentTab text={text} editable={this.props.editable && text.status == 'debate'}/>
                    </Panel>
                    : <div/>}
                <Panel eventKey={eventKey++} header={'Sources (' + (sources ? sources.length : 0) + ')'}>
                    <SourceTab text={text} editable={this.props.editable && text.status == 'review'}/>
                </Panel>
                <Panel eventKey={eventKey++} header="Propositions (0)">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <p>{this.getIntlMessage('text.NO_PROPOSAL')}</p>
                                {this.props.editable && text.status == 'review'
                                    ? !this.isAuthenticated()
                                        ? <p className="hint">
                                            {this.renderLoginMessage(this.getIntlMessage('text.ADD_PROPOSAL_LOGIN'))}
                                        </p>
                                        : <Button bsStyle="primary">
                                            {this.getIntlMessage('text.ADD_PROPOSAL')}
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

module.exports = Text;
