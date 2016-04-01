var React = require('react');
var ReactIntl = require('react-intl');

var LoadingIndicator = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <span>
                <span className="loading-indicator"/>
                {this.props.text ? this.props.text : this.getIntlMessage('site.LOADING') + '...'}
            </span>
		);
	}
});

module.exports = LoadingIndicator;
