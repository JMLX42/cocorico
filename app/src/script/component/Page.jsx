var React = require('react');
var ReactIntl = require('react-intl');
var Markdown = require('react-remarkable');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var StringHelper = require('../helper/StringHelper');

var PageStore = require('../store/PageStore');
var PageAction = require('../action/PageAction');
var Error404 = require('../page/Error404');

var LoadingIndicator = require('./LoadingIndicator');

var Page = React.createClass({
  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(PageStore, 'pages'),
  ],

  componentWillMount: function() {
    PageAction.readPage(this.props.slug);
  },

  componentWillReceiveProps: function(props) {
    PageAction.readPage(props.slug);
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.props.componentDidUpdate)
      this.props.componentDidUpdate(prevProps, prevState);
  },

  getPageContent: function(page) {
    if (page.contentType === 'Markdown')
      return <Markdown source={page.markdown.md} options={{linkify:true,html:true}}/>;
    else
      return <div dangerouslySetInnerHTML={{__html: this.state.pages.getPageBySlug(this.props.slug).html}} />;
  },

  render: function() {
    if (!this.state.pages || this.state.pages.pageIsLoading(this.props.slug))
      return <LoadingIndicator/>;

    var page = this.state.pages.getPageBySlug(this.props.slug);

    if (!page)
      return <LoadingIndicator/>;

    if (page.error === 404)
      return (
        <Error404 />
      );

    return (
      this.props.setDocumentTitle
        ? <ReactDocumentTitle title={StringHelper.toTitleCase(page.title) + ' - ' + this.getIntlMessage('site.TITLE')}>
          {this.props.hideContent
            ? <div/>
            : this.getPageContent(page)}
          </ReactDocumentTitle>
          : this.props.hideContent
            ? <div/>
            : this.getPageContent(page)
		);
  },
});

module.exports = Page;
