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
                        <Tabs defaultActiveKey={1}>
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
