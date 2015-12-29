var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Markdown = require('react-remarkable');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var PageStore = require('../store/PageStore');
var PageAction = require('../action/PageAction');
var Error404 = require('../page/Error404');

var FormattedMessage = ReactIntl.FormattedMessage;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Page = React.createClass({
    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(PageStore, 'pages')
    ],

    componentWillMount: function()
    {
        PageAction.readPage(this.props.slug);
    },

    componentWillReceiveProps: function(props)
    {
        PageAction.readPage(props.slug);
    },

    componentDidUpdate: function(prevProps, prevState)
    {
        if (this.props.componentDidUpdate)
            this.props.componentDidUpdate(prevProps, prevState);
    },

    getPageContent: function(page)
    {
        if (page.contentType == 'Markdown')
            return <Markdown source={page.markdown.md} />;
        else
            return <div dangerouslySetInnerHTML={{__html: this.state.pages.getPageBySlug(this.props.slug).html}}></div>;
    },

    render: function()
    {
        if (!this.state.pages)
            return null;

        var page = this.state.pages.getPageBySlug(this.props.slug);

        if (!page)
            return null;

        if (page.error == 404)
            return (
                <Grid>
                    <Row>
                        <Col md={12}>
                            <Error404 />
                        </Col>
                    </Row>
                </Grid>
            );

		return (
            <ReactDocumentTitle title={page.title + ' - ' + this.getIntlMessage('site.TITLE')}>
                <Grid>
                    <Row>
                        <Col md={12}>
                            {this.getPageContent(page)}
                        </Col>
                    </Row>
                </Grid>
            </ReactDocumentTitle>
		);
	}
});

module.exports = Page;
