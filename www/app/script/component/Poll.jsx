var React = require('react');
var Markdown = require('react-remarkable');
var VoteButton = require('./VoteButton');
var ReactBootstrap = require('react-bootstrap');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var Poll = React.createClass({
    render: function()
    {
        if (!this.props.poll)
            return null;

		return (
            <div>
                <h1 className="poll-title">{this.props.poll.title}</h1>
                <div className="poll-content">
                    <Markdown source={this.props.poll.content.extended.md} />
                </div>
                <ButtonToolbar className="text-center">
                    <VoteButton text="Yes" className="btn-vote-yes"/>
                    <VoteButton text="No" className="btn-vote-no"/>
                </ButtonToolbar>
            </div>
		);
	}
});

module.exports = Poll;
