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
    Button = ReactBootstrap.Button;

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
        var state = {};

        state.activeKey = 1;
        if (this.props.tab == this.getIntlMessage('route.VIEW_TEXT_TAB_SOURCES'))
            state.activeKey = 2;
        if (this.props.tab == this.getIntlMessage('route.VIEW_TEXT_TAB_PROPOSITIONS'))
            state.activeKey = 3;

        return state;
    },

    componentWillMount: function()
    {
        this.context.history.key = this.getTabSlugByKey(this.state.activeKey);
    },

    getTabSlugByKey: function(key)
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
            slugs.unshift();
        }

        return slugs[key - 1];
    },

    tabSelectHandler: function(key)
    {
        this.context.history.push(
            this.getIntlMessage('route.VIEW_TEXT')
            + '/' + this.props.text.id
            + '/' + this.props.text.slug
            + '/' + this.getTabSlugByKey(key)
        );

        this.setState({ activeKey : key });
    },

    render: function()
    {
        var text = this.props.text;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByTextId(text.id)
            : null;

        var eventKey = 1;

        return (
            <Grid>
                <Row className="section" style={{border:'none'}}>
                    <Col md={12}>
                        <Tabs activeKey={this.state.activeKey} onSelect={this.tabSelectHandler}>
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
                    </Col>
                </Row>
            </Grid>
        );
    }
});

module.exports = Text;
