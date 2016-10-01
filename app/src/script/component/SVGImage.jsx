var React = require('react');

var SVGImage = React.createClass({

  render: function() {
    return (
      <div dangerouslySetInnerHTML={{__html: this.props.data}}/>
    );
  },

});

module.exports = SVGImage;
