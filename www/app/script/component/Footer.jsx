var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Link = ReactRouter.Link;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Footer = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div id="footer">
                <Grid>
                    <Row>
                        <Link to="/page/privacy-policy">
                            {this.getIntlMessage('footer.PRIVACY_POLICY')}
                        </Link>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Footer;
