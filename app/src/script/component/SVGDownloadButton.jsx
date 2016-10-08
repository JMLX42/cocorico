var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');

var Icon = require('./Icon');

var Button = ReactBootstrap.Button;

var SVGDownloadButton = React.createClass({

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
    // IE workaround for not supporting the download anchor attribute
    // FIXME: IE8 workaround https://jsfiddle.net/gokpfr00/41/
    if (window.navigator.msSaveBlob)
      window.navigator.msSaveBlob(new Blob([this.props.data]), this.props.filename);

    this.props.onClick(e);
  },

  render: function() {
    if (!this.props.data) {
      return null;
    }

    return (
      !!window.navigator.msSaveBlob
        ? <Button className={this.props.className} onClick={this.onClick}>
          <Icon name="download"/>
          {this.props.children}
        </Button>
        : <a className={this.props.className}
            href={'data:image/svg+xml;utf8,' + this.props.data}
            download={this.props.filename}
            onClick={this.onClick}>
            <Icon name="download"/>
            {this.props.children}
        </a>
    );
  },

});

module.exports = SVGDownloadButton;
