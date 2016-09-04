var React = require('react');

var RedirectLink = React.createClass({

    getDefaultProps() {
        return {
            'target': '_blank',
            'className': ''
        };
    },

    render: function()
    {
        return (
            <a href={'/api/redirect?url=' + this.props.href}
                target={this.props.target}
                className={this.props.className}>
                {this.props.children}
            </a>
        );
    }
});

module.exports = RedirectLink;
