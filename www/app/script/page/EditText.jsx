var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextStore = require("../store/TextStore");

var TextAction = require("../action/TextAction");

var TextEditor = require("../component/TextEditor");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var EditText = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    getInitialState: function()
    {
        return {textId: null};
    },

    componentWillReceiveProps: function(props)
    {
        this.setState({textId: props.params.textId});
    },

    componentDidMount: function()
    {
        this.setState({textId: this.props.params.textId});
    },

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        if (!this.state.textId)
            return null;

		return (
            <div className="page page-create-text">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h1>Modifier un texte</h1>
                        </Col>
                    </Row>
                </Grid>

                <TextEditor textId={this.state.textId}/>
            </div>
		);
	}
});

module.exports = EditText;
