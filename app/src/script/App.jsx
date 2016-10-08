var React = require('react')
var ReactIntl = require('react-intl');

var Header = require('./component/Header'),
  Footer = require('./component/Footer');

var App = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
  ],

  childContextTypes: {
    location: React.PropTypes.object,
  },

  getChildContext() {
    return { location: this.props.location }
  },

  getDefaultProps: function() {
    return {
      messages: require('./intl/locale.js').getCurrentLocaleMessages(),
    };
  },

  render: function() {
    return (
      <div>
        <Header/>
        <div className="content">
            {this.props.children || <div/>}
        </div>
        <Footer/>
      </div>
    );
  },
});

module.exports = App;
