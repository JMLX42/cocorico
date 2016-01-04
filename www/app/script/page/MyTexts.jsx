var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactDocumentTitle = require('react-document-title');

var TextAction = require("../action/TextAction");
var TextStore = require("../store/TextStore");

var TextList = require("../component/TextList");

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab;

var Link = ReactRouter.Link;

var MyTexts = React.createClass({

    mixins: [
        Reflux.connect(TextStore, 'texts'),
        Reflux.ListenerMixin,
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        TextAction.listCurrentUserTexts();

        this.listenTo(TextAction.changeStatus, this.textStatusChangedHandler);
    },

    textStatusChangedHandler: function(textId, state)
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

        var texts = this.state.texts
            ? this.state.texts.getCurrentUserTexts()
            : null;

        var filteredTexts = {};
        for (var text of texts)
            if (filteredTexts[text.status])
                filteredTexts[text.status].push(text);
            else
                filteredTexts[text.status] = [text];

		return (
            <ReactDocumentTitle title={this.getIntlMessage('page.myTexts.TITLE') + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="page page-my-texts">
                    <Grid>
                        <Row>
                            <Col md={10}>
                                <h1>{this.getIntlMessage('page.myTexts.TITLE')}</h1>
                            </Col>
                            <Col md={2}>
                                <Link to={this.getIntlMessage('route.CREATE_TEXT')} className="pull-right">
                                    <Button bsSize="large" bsStyle="primary" className="btn-create-text">
                                        {this.getIntlMessage('page.myTexts.NEW_TEXT')}
                                    </Button>
                                </Link>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Tabs activeKey={this.state.activeKey} onSelect={this.tabSelectHandler} className="tabs-my-texts">
                                    <Tab eventKey={1} title={"Brouillon (" + (filteredTexts['draft'] || []).length + ")"}>
                                        <TextList texts={filteredTexts['draft']} editable={true}/>
                                    </Tab>
                                    <Tab eventKey={2} title={"Révision (" + (filteredTexts['review'] || []).length + ")"}>
                                        <TextList texts={filteredTexts['review']} editable={true} />
                                    </Tab>
                                    <Tab eventKey={3} title={"Débat (" + (filteredTexts['debate'] || []).length + ")"}>
                                        <TextList texts={filteredTexts['debate']} editable={true} />
                                    </Tab>
                                    <Tab eventKey={4} title={"Vote (" + (filteredTexts['vote'] || []).length + ")"}>
                                        <TextList texts={filteredTexts['vote']} editable={true} />
                                    </Tab>
                                    <Tab eventKey={5} title={"Publié (" + (filteredTexts['published'] || []).length + ")"}>
                                        <TextList texts={filteredTexts['published']} editable={true} />
                                    </Tab>
                                </Tabs>
                            </Col>
                        </Row>

                    </Grid>
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = MyTexts;
