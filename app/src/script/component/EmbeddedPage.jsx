var React = require('react');

var Footer = require('./Footer');

var EmbeddedPage = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.children || <div/>}
        <Footer/>
      </div>
    );
  },

});

module.exports = EmbeddedPage;
