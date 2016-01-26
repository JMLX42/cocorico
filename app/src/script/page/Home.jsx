var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextStore = require("../store/TextStore");

var TextAction = require("../action/TextAction");

var TextList = require("../component/TextList"),
    Page = require("../component/Page"),
    PageTitle = require("../component/PageTitle");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Home = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(TextStore, 'texts'),
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        TextAction.showLatestTexts();
    },

    render: function()
    {
		return (
            <div className="page-home">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <Page slug="accueil" setDocumentTitle={true} hideContent={this.isAuthenticated()}/>
                            </Col>
                        </Row>
                    <Row>
                        <Col md={12}>
                            <h2>{this.getIntlMessage('text.TEXTS')}</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {this.state && this.state.texts
                                ? <TextList texts={this.state.texts.getLatestTexts()} />
                                : <div/>}
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Home;
