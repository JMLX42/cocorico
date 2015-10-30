var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var TextStore = require("../store/TextStore");

var TextAction = require("../action/TextAction");

var TextList = require("../component/TextList"),
    Page = require("../component/Page");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Home = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div className="page-home">
                <Page slug="accueil"/>
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h2>{this.getIntlMessage('text.TEXTS')}</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <TextList />
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Home;
