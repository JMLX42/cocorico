var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var Markdown = require('react-remarkable');

var PageStore = require('../store/PageStore');
var PageAction = require('../action/PageAction');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Page = React.createClass({
    mixins: [Reflux.connect(PageStore, 'pages')],

    componentWillReceiveProps: function(props)
    {
        PageAction.readPage(props.params.slug);
    },

    componentDidMount: function()
    {
        PageAction.readPage(this.props.params.slug);
    },

    getPageContent: function(page)
    {
        if (page.contentType == 'Markdown')
            return <Markdown source={page.markdown.md} />;
        else
            return <div dangerouslySetInnerHTML={{__html: this.state.pages.getPageBySlug(this.props.params.slug).html}}></div>;
    },

    render: function()
    {
        if (!this.state.pages)
            return null;

        var page = this.state.pages.getPageBySlug(this.props.params.slug);

        if (!page)
            return null;

		return (
            <Grid>
                <Row>
                    {this.getPageContent(page)}
                </Row>
            </Grid>
		);
	}
});

module.exports = Page;
