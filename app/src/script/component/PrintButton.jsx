var React = require('react');
var ReactDOM = require('react-dom');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var PrintHTMLElement = require('print-html-element');

var Icon = require('./Icon');

var Button = ReactBootstrap.Button;

var PrintButton = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
  ],

  getDefaultProps: function() {
    return {
      className: 'btn btn-primary',
      onClick: (e) => null,
    };
  },

  onClick: function(e) {
    PrintHTMLElement.printElement(
      ReactDOM.findDOMNode(this.refs.elementToPrint),
      { printMode: 'popup' }
    );

    this.props.onClick(e);
  },

  render: function() {
    return (
      <span>
        <Button className={this.props.className} onClick={this.onClick}>
          <Icon name="printer"/>
          {this.props.text}
        </Button>
        <div ref="elementToPrint" className="visible-print">
          {this.props.children}
        </div>
      </span>
    );
  },

});

module.exports = PrintButton;
