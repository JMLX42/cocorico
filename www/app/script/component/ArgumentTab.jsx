var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var ArgumentList = require('./ArgumentList');

var Link = ReactRouter.Link;

var FormattedMessage = ReactIntl.FormattedMessage;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var Footer = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin
    ],

    componentDidMount: function()
    {

    },

    render: function()
    {
		return (
            <Grid>
                <Row>
                    <Col md={6}>
                        <h3>Arguments 'pour'</h3>
                        <ArgumentList filterFunction={(arg) => false}/>
                        {this.props.editable && this.isAuthenticated()
                            ? <Button bsStyle="primary">
                                <FormattedMessage message={this.getIntlMessage('text.ADD_ARGUMENT')}
                                                  value={this.getIntlMessage('text.VOTE_YES')}/>
                            </Button>
                            : <div/>}
                    </Col>
                    <Col md={6}>
                        <h3>Arguments 'contre'</h3>
                        <ArgumentList filterFunction={(arg) => false}/>
                        {this.props.editable && this.isAuthenticated()
                            ? <Button bsStyle="danger">
                                <FormattedMessage message={this.getIntlMessage('text.ADD_ARGUMENT')}
                                                  value={this.getIntlMessage('text.VOTE_NO')}/>
                            </Button>
                            : <div/>}
                    </Col>
                </Row>
                {this.props.editable && !this.isAuthenticated()
                    ? <p className="hint">
                        {this.renderLoginMessage(this.getIntlMessage('text.ADD_ARGUMENT_LOGIN'))}
                    </p>
                    : <div/>}
            </Grid>
		);
	}
});

module.exports = Footer;
