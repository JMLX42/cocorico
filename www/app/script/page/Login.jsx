var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var $ = require('jquery');

var Page = require('../component/Page');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Login = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getInitialState: function()
    {
        return {
            redirect: this.props.params && this.props.params.redirect
                ? this.props.params.redirect
                : this.props.redirect
        };
    },

    updateLoginLink: function()
    {
        if (!this.state.redirect)
            return;

        var link = document.getElementById('link-login');

        if (link)
            link.href = '/auth/login?redirect=' + encodeURIComponent(this.state.redirect);
    },

    componentDidUpdate: function()
    {
        this.updateLoginLink();
    },

    componentDidMount: function()
    {
        this.updateLoginLink();
    },

    render: function()
    {
		return (
            <div className="page">
                <Grid>
                    {this.props.message
                        ? <Row>
                            <Col md={12}>
                                <p>
                                    {this.props.message}
                                </p>
                            </Col>
                        </Row>
                        : <div/>}
                    <Row>
                        <Col md={12}>
                            <div>
                                <Page slug="connexion" componentDidUpdate={this.updateLoginLink}/>
                            </div>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Login;
