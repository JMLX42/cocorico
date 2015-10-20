var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Input = ReactBootstrap.Input,
    Button = ReactBootstrap.Button;

var Link = ReactRouter.Link,
    ButtonToolbar = ReactBootstrap.ButtonToolbar;

var Login = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <Grid>
                <Row>
                    <Col md={4} mdOffset={4}>
                        <h1>{this.getIntlMessage('login.SIGN_IN')}</h1>
                        <Input type="text" placeholder={this.getIntlMessage('login.USERNAME')}/>
                        <Input type="password" placeholder={this.getIntlMessage('login.PASSWORD')}/>
                        <ButtonToolbar>
                            <Button bsStyle="primary">
                                {this.getIntlMessage('login.SIGN_IN')}
                            </Button>
                            <Button bsStyle="link">
                                <Link to="/forgotten-password">
                                    {this.getIntlMessage('login.FORGOTTEN_PASSWORD')}
                                </Link>
                            </Button>
                        </ButtonToolbar>
                        <ButtonToolbar>
                            <Button>
                                <Link to="/join">
                                    {this.getIntlMessage('login.SIGN_UP')}
                                </Link>
                            </Button>
                        </ButtonToolbar>
                    </Col>
                </Row>
            </Grid>
		);
	}
});

module.exports = Login;
