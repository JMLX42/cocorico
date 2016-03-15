var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Title = require('./Title');

var Link = ReactRouter.Link;

var Bill = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    render: function()
    {
		return (
            <Link to={this.getIntlMessage('route.VIEW_BILL') + '/' + this.props.bill.slug}>
                <Title text={this.props.bill.title}/>
            </Link>
		);
	}
});

module.exports = Bill;
