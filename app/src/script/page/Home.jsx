var React = require('react');

var Page = require("../component/Page");

var Home = React.createClass({

    render: function()
    {
		return (
            <div className="page page-home">
                <Page slug="accueil" setDocumentTitle={true}/>
            </div>
		);
	}
});

module.exports = Home;
