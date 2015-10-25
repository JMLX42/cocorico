var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var PageComponent = require('../component/Page');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Page = React.createClass({

    componentWillReceiveProps: function(props)
    {
        this.setState({'slug': props.params.slug});
    },

    componentDidMount: function()
    {
        this.setState({'slug': this.props.params.slug});
    },

    render: function()
    {
        if (!this.state || !this.state.slug)
            return null;

		return (
            <div className="page">
                <PageComponent slug={this.state.slug} />
            </div>
		);
	}
});

module.exports = Page;
