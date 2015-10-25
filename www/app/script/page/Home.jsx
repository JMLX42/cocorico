var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var PollStore = require("../store/PollStore");

var PollAction = require("../action/PollAction");

var Poll = require("../component/Poll"),
    Page = require("../component/Page");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Home = React.createClass({
    // mixins: [Reflux.connect(PollStore, 'polls')],

    componentDidMount: function()
    {
        // PollAction.showLatest();
    },

    render: function()
    {
		return (
            <div className="page-home">
                <Page slug="accueil"/>
            </div>
		);
	}
});

module.exports = Home;
