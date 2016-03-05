var React = require('react');

var StringHelper = require('../helper/StringHelper');

var Title = React.createClass({

    render: function()
    {
		return <span>{StringHelper.toTitleCase(this.props.text)}</span>;
	}
});

module.exports = Title;
