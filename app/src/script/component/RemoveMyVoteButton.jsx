var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteAction = require('../action/VoteAction');

var BallotStore = require('../store/BallotStore');

var VoterCardReaderModal = require('./VoterCardReaderModal'),
    LoadingIndicator = require('./LoadingIndicator');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var RemoveMyVoteButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function() {
        return {
            proofOfVoteRequired: true
        };
    },

    getInitialState: function() {
        return {
            showVoterCardReader: false
        };
    },

    handleClick: function()
    {
        if (this.props.proofOfVoteRequired) {
            this.setState({
                showVoterCardReader: true
            });
        }
        else {
            this.removeVote();
        }
    },

    componentWillUnmount: function() {
        // if (this._unsubscribe) {
        //     this._unsubscribe();
        // }
    },

    proofOfVoteReaderSuccess: function(data) {
        this.setState({
            showVoterCardReader: false,
            unvoting: true
        });

        this.removeVote();
    },

    removeVote: function() {
        VoteAction.unvote(this.props.bill.id);
    },

    proofOfVoteReaderCancelled: function() {
        this.setState({
            showVoterCardReader: false
        });
    },

    render: function()
    {
		return (
            <Button onClick={this.handleClick} className="btn-unvote">
                {this.props.value
                    ? this.props.value
                    : this.getIntlMessage('vote.REMOVE_MY_VOTE')}
                {this.state.showVoterCardReader
                    ? <VoterCardReaderModal
                            onSuccess={this.proofOfVoteReaderSuccess}
                            onCancel={this.proofOfVoteReaderCancelled}/>
                    : <span/>}
            </Button>
		);
	}
});

module.exports = RemoveMyVoteButton;
