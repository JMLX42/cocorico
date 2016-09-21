var React = require('react')
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Embed = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    childContextTypes: {
        location: React.PropTypes.object
    },

    getChildContext() {
        return { location: this.props.location }
    },

    getDefaultProps: function() {
        return {
            messages: require('./intl/locale.js').getCurrentLocaleMessages()
        };
    },

    render: function()
    {
        return (
            <div className="embed">
                {this.props.children || <div/>}
            </div>
        );
     }
});

module.exports = Embed;
