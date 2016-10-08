var React = require('react');

var Icon = React.createClass({

  render: function() {
    return (
      <i className={'icon-' + this.props.name}/>
    );
  },

});

module.exports = Icon;
