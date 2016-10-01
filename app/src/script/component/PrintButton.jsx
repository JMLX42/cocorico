var React = require('react');
var ReactDOM = require('react-dom');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var PrintHTMLElement = require('print-html-element');
var MediaQuery = require('react-responsive');

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
    console.log(this.refs.elementToPrint);
    console.log(ReactDOM.findDOMNode(this.refs.elementToPrint));
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
        <div ref="elementToPrint">
          <MediaQuery print={true}>
            {this.props.children}
          </MediaQuery>
        </div>
      </span>
    );
  },

});

module.exports = PrintButton;
