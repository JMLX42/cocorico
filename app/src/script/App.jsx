var React = require('react')
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var Header = require('./component/Header');
var Footer = require('./component/Footer');
var Pace = require('./component/Pace');

var Intl = require('./intl/intl');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

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
                <Pace />
				<Header />
                    <div id="content">
                        {this.props.children || <div />}
    				</div>
				<Footer />
			</div>
		);
	}
});

module.exports = App;
