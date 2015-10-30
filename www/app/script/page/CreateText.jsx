var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var TextStore = require("../store/TextStore");

var TextAction = require("../action/TextAction");

var TextList = require("../component/TextList");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Input = ReactBootstrap.Input;

var Link = ReactRouter.Link;

var CreateText = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(TextStore, 'texts')
    ],

    render: function()
    {
		return (
            <div className="page page-create-text">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h1>Créer un texte</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <h2>Titre</h2>
                            <Input type="texte" placeholder="titre" />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <h2>Texte</h2>
                            <Input type="textarea" placeholder="texte" />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Button bsSize="large" bsStyle="primary">Créer</Button>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = CreateText;
