var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteAction = require('../action/VoteAction');

var BallotStore = require('../store/BallotStore');

var ProofOfVoteReader = require('./ProofOfVoteReader'),
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
            showProofOfVoteReader: false
        };
    },

    handleClick: function()
    {
        if (this.props.proofOfVoteRequired) {
            this.setState({
                showProofOfVoteReader: true
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
            showProofOfVoteReader: false,
            unvoting: true
        });

        this.removeVote();
    },

    removeVote: function() {
        VoteAction.unvote(this.props.bill.id);
    },

    proofOfVoteReaderCancelled: function() {
        this.setState({
            showProofOfVoteReader: false
        });
    },

    render: function()
    {
		return (
            <Button onClick={this.handleClick} className="btn-unvote">
                {this.props.value
                    ? this.props.value
                    : this.getIntlMessage('vote.REMOVE_MY_VOTE')}
                {this.state.showProofOfVoteReader
                    ? <ProofOfVoteReader
                        data={this.props.proofOfVoteRequired}
                        onSuccess={this.proofOfVoteReaderSuccess}
                        onCancel={this.proofOfVoteReaderCancelled}/>
                    : <span/>}
            </Button>
		);
	}
});

module.exports = RemoveMyVoteButton;
