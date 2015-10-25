var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var VoteButton = require('./VoteButton');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var VoteButtonBar = React.createClass({

    render: function()
    {
		return (
            <ButtonToolbar className="text-center">
                <VoteButton text="poll.VOTE_YES"
                            poll={this.props.pollId}
                            value="yes"
                            className="btn-vote-yes"/>
                        <VoteButton text="poll.VOTE_BLANK"
                            poll={this.props.pollId}
                            value="blank"
                            className="btn-vote-blank"/>
                        <VoteButton text="poll.VOTE_NO"
                            poll={this.props.pollId}
                            value="no"
                            className="btn-vote-no"/>
            </ButtonToolbar>
		);
	}
});

module.exports = VoteButtonBar;
