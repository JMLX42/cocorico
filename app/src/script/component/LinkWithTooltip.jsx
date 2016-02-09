var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var Tooltip = ReactBootstrap.Tooltip,
    OverlayTrigger = ReactBootstrap.OverlayTrigger;

module.exports = React.createClass({
    render()
    {
        let tooltip = <Tooltip>{this.props.tooltip}</Tooltip>;

        return (
            <OverlayTrigger
                overlay={tooltip} placement="top"
                delayShow={300} delayHide={150}>
                <a href={this.props.href}>{this.props.children}</a>
            </OverlayTrigger>
        );
    }
});
