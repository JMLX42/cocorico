var React = require('react')
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactRouter = require('react-router');

var Poll = require('./component/Poll');
var Header = require('./component/Header');
var Footer = require('./component/Footer');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Intl = require('./intl/intl');

var App = React.createClass({

	mixins: [ReactIntl.IntlMixin],

    getDefaultProps: function(){
        return {
            locales: Intl.locales,
            messages: Intl.messages
        };
    },

	render: function()
    {
		return (
			<div>
				<Header />
                    <div id="content">
                        <Grid>
    						<Row>
                                {this.props.children || ''}
    						</Row>
    					</Grid>
    				</div>
				<Footer />
			</div>
		);
	}
});

module.exports = App;
