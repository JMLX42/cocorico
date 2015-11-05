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
        return {slug: null};
    },

    componentWillReceiveProps: function(props)
    {
        this.setState({slug: props.params.slug});
    },

    componentDidMount: function()
    {
        this.setState({slug: this.props.params.slug});
    },

    render: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginPage(this.getIntlMessage('login.REQUIRE_LOGIN'));

        if (!this.state.slug)
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

                <TextEditor slug={this.state.slug}/>
            </div>
		);
	}
});

module.exports = EditText;
