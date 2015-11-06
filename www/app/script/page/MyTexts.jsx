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
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentDidMount: function()
    {
        TextAction.listCurrentUserTexts();
    },

	render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        var texts = this.state.texts
            ? this.state.texts.getCurrentUserTexts()
            : null;

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
                                <Tabs defaultActiveKey={1} className="tabs-my-texts">
                                    <Tab eventKey={1} title="Brouillon">
                                        <TextList texts={texts} editable={true} filterFunction={(text) => text.status == 'draft'}/>
                                    </Tab>
                                    <Tab eventKey={2} title="Publié">
                                        <TextList texts={texts} editable={true} filterFunction={(text) => text.status == 'published'}/>
                                    </Tab>
                                    <Tab eventKey={3} title="Revue">
                                        <TextList texts={texts} editable={true} filterFunction={(text) => false} />
                                    </Tab>
                                    <Tab eventKey={4} title="Vote">
                                        <TextList texts={texts} editable={true} filterFunction={(text) => false} />
                                    </Tab>
                                    <Tab eventKey={5} title="Validé">
                                        <TextList texts={texts} editable={true} filterFunction={(text) => false} />
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
