var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextStore = require('../store/TextStore');

var TextAction = require('../action/TextAction');

var TextEditor = require('../component/TextEditor');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var CreateText = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

		return (
            <ReactDocumentTitle title={this.getIntlMessage('page.createText.TITLE') + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="page page-create-text">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <h1>{this.getIntlMessage('page.createText.TITLE')}</h1>
                            </Col>
                        </Row>
                    </Grid>

                    <TextEditor />
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = CreateText;
