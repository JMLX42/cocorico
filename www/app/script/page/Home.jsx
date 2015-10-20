var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var PollStore = require("../store/PollStore");
var PollAction = require("../action/PollAction");
var Poll = require("../component/Poll");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Link = ReactRouter.Link;

var Home = React.createClass({
    mixins: [Reflux.connect(PollStore, 'polls')],

    componentDidMount: function()
    {
        PollAction.showLatest();
    },

    render: function()
    {
        if (!this.state.polls)
            return null;

		return (
            <Grid>
                <Row>
                    <Poll poll={this.state.polls.latest()}/>
                </Row>
            </Grid>
		);
	}
});

module.exports = Home;
