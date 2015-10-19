var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

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
                        {this.getIntlMessage('footer.PRIVACY_POLICY')}
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = Footer;
