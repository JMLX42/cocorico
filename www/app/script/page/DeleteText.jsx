var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextStore = require("../store/TextStore");

var TextAction = require("../action/TextAction");

var TextLink = require("../component/TextLink");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar;

var Link = ReactRouter.Link;

var EditText = React.createClass({

    mixins: [
        Reflux.connect(TextStore, 'texts'),
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillReceiveProps: function(props)
    {
        TextAction.show(props.params.textId);
    },

    componentDidMount: function()
    {
        TextAction.show(this.props.params.textId);
    },

    deleteClickHandler: function(event)
    {
        TextAction.delete(this.props.params.textId);
    },

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        var text = this.state && this.state.texts
            ? this.state.texts.getById(this.props.params.textId)
            : null;

        if (!text)
            return null;

		return (
            <div className="page page-delete-text">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <p>
                                Êtes-vous sûr de vouloir supprimer le texte "
                                    <TextLink textId={text.id}/>
                                " ?
                                <br />
                                Cette opération ne pourra pas être annulée !
                            </p>
                            <ButtonToolbar className="text-center">
                                <Button bsStyle="danger" bsSize="large" onClick={this.deleteClickHandler}>Supprimer</Button>
                                <Button bsSize="large">Annuler</Button>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = EditText;
