var React = require('react');
var ReactIntl = require('react-intl');

var Page = require('../component/Page');

var Home = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
  ],

  render: function() {
    return (
      <div className="page page-home">
          <Page slug={this.getIntlMessage('slug.HOME')} setDocumentTitle={true}/>
      </div>
    );
  },
});

module.exports = Home;
