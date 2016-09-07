var React = require('react')
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Intl = require('./intl/intl');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Embed = React.createClass({

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
            <div className="embed">
                {this.props.children || <div/>}
            </div>
        );
     }
});

module.exports = Embed;
