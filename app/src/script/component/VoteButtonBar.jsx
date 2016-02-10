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
            <ButtonToolbar className="bill-center">
                <VoteButton message="bill.VOTE_YES"
                            bill={this.props.billId}
                            value="yes"
                            className="btn-vote-yes"/>
                        <VoteButton message="bill.VOTE_BLANK"
                            bill={this.props.billId}
                            value="blank"
                            className="btn-vote-blank"/>
                        <VoteButton message="bill.VOTE_NO"
                            bill={this.props.billId}
                            value="no"
                            className="btn-vote-no"/>
            </ButtonToolbar>
		);
	}
});

module.exports = VoteButtonBar;
