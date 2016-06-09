var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Link = ReactRouter.Link;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Footer = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div id="footer">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <ul className="list-unstyled list-inline">
                                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                                    <Link to={this.getIntlMessage('route.PRIVACY_POLICY')}>
                                        {this.getIntlMessage('footer.PRIVACY_POLICY')}
                                    </Link>
                                </li>
                                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                                    <a href="https://github.com/promethe42/cocorico">
                                        {this.getIntlMessage('footer.SOURCE_CODE')}
                                    </a>
                                </li>
                                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                                    <Link to={this.getIntlMessage('route.SERVICE_STATUS')}>
                                        {this.getIntlMessage('footer.SERVICE_STATUS')}
                                    </Link>
                                </li>
                            </ul>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Footer;
