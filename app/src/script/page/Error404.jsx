var React = require('react');
var ReactIntl = require('react-intl');

var Error404 = React.createClass({

  mixins: [ReactIntl.IntlMixin],

  render: function() {
    return (
      <div className="error-404">
        <div className="error-message">
          {this.getIntlMessage('error.ERROR_404')}
        </div>
      </div>
    );
  },
});

module.exports = Error404;
