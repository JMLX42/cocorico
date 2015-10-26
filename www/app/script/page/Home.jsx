var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var PollStore = require("../store/PollStore");

var PollAction = require("../action/PollAction");

var PollList = require("../component/PollList"),
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
                            <h2>{this.getIntlMessage('poll.POLLS')}</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <PollList />
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Home;
