var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactCookie = require('react-cookie');

var Page = require('./Page');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var Hint = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    getInitialState: function()
    {
        return {
            hidden : ReactCookie.load('hint/' + this.props.pageSlug)
        };
    },

    buttonClickHandler: function(e)
    {
        ReactCookie.save('hint/' + this.props.pageSlug, true);
        this.setState({hidden : true});
    },

    render: function()
    {
		return (
            !this.state.hidden
                ? <div className={this.props.className}>
                    <Page slug={this.props.pageSlug}/>
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <Button onClick={this.buttonClickHandler}>
                                    J'ai compris, ne plus afficher ce message
                                </Button>
                            </Col>
                        </Row>
                    </Grid>
                </div>
                : <div/>
		);
	}
});

module.exports = Hint;
