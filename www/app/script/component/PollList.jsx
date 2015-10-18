var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var PollAction = require("./action/PollAction");
var PollStore = require("./store/PollStore");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var PollList = React.createClass({

    mixins: [Reflux.ListenerMixin],

    getInitialState: function()
    {
        return {
            polls: PollStore.get()
        };
    },

    componentDidMount: function()
    {
        this.listenTo(PollStore, this.onPollStoreChange);

        PollAction.list();
    },

    onPollStoreChange: function(error, polls)
    {
        if (error || polls != PollStore.get())
            return;

        this.setState({
            polls: PollStore.get()
        });
    },

	render: function()
    {
		return (
            <Grid>
                <Row>
                    <h2>Polls</h2>
                </Row>
                <Row>
        			<ul>
                        {this.state.polls.map(function(poll)
                        {
                            return <li>{poll.title}</li>;
                        })}
        			</ul>
                </Row>
            </Grid>
		);
	}
});

module.exports = PollList;
