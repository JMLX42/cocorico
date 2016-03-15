var React = require('react');
var ReactIntl = require('react-intl');

var LoadingIndicator = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div>
                <span className="loading-indicator"/>
                {this.props.text ? this.props.text : this.getIntlMessage('site.LOADING') + '...'}
            </div>
		);
	}
});

module.exports = LoadingIndicator;
