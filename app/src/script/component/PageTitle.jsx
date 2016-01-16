var React = require('react');
var Reflux = require('reflux');

var PageStore = require('../store/PageStore');
var PageAction = require('../action/PageAction');

var PageTitle = React.createClass({
    mixins: [
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

    render: function()
    {
        if (!this.state.pages)
            return null;

        var page = this.state.pages.getPageBySlug(this.props.slug);

        if (!page)
            return null;

		return (
            <span className={this.props.className}>{page.title}</span>
        );
	}
});

module.exports = PageTitle;
