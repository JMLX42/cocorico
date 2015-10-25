var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Error404 = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
        return (
            <div className="error-404">
                <Grid>
                    <Row>
                        <div className="error-message">
                            {this.getIntlMessage('error.ERROR_404')}
                        </div>
                    </Row>
                </Grid>
            </div>
        );
	}
});

module.exports = Error404;
