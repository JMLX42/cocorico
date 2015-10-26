var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var PollAction = require("../action/PollAction");
var PollStore = require("../store/PollStore");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var PollList = React.createClass({

    mixins: [Reflux.connect(PollStore, 'polls')],

    componentDidMount: function()
    {
        PollAction.list();
    },

	render: function()
    {
        if (!this.state.polls)
            return null;

		return (
            <Grid>
                <Row>
        			<ul className="list-unstyled">
                        {this.state.polls.get().map(function(poll)
                        {
                            return <li>
                                <Link to={'/poll/' + poll.slug}>
                                    {poll.title}
                                </Link>
                            </li>;
                        })}
        			</ul>
                </Row>
            </Grid>
		);
	}
});

module.exports = PollList;
