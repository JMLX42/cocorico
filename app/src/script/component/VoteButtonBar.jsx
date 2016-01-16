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
                <VoteButton message="text.VOTE_YES"
                            text={this.props.textId}
                            value="yes"
                            className="btn-vote-yes"/>
                        <VoteButton message="text.VOTE_BLANK"
                            text={this.props.textId}
                            value="blank"
                            className="btn-vote-blank"/>
                        <VoteButton message="text.VOTE_NO"
                            text={this.props.textId}
                            value="no"
                            className="btn-vote-no"/>
            </ButtonToolbar>
		);
	}
});

module.exports = VoteButtonBar;
