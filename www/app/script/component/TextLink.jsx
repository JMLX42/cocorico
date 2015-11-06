var React = require('react');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Link = ReactRouter.Link;

var Text = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    render: function()
    {
		return (
            <Link to={this.getIntlMessage('route.VIEW_TEXT') + '/' + this.props.text.id + '/' + this.props.text.slug}>
                {this.props.text.title}
            </Link>
		);
	}
});

module.exports = Text;
