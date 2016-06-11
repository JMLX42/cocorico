var React = require('react');

var RedirectLink = React.createClass({

    render: function()
    {
        return (
            <a href={'/api/redirect?url=' + this.props.href}>{this.props.children}</a>
        );
    }
});

module.exports = RedirectLink;
