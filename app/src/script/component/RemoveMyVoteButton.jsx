var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteAction = require('../action/VoteAction');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var VoterCardReaderModal = require('./VoterCardReaderModal'),
    LoadingIndicator = require('./LoadingIndicator');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var RemoveMyVoteButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts')
    ],

    getDefaultProps: function() {
        return {
            voterCardRequired: true
        };
    },

    getInitialState: function() {
        return {
            showVoterCardReader: false
        };
    },

    handleClick: function()
    {
        if (this.props.voterCardRequired) {
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

    voterCardReaderSuccess: function(data) {
        this.setState({
            showVoterCardReader: false,
            unvoting: true
        });

        this.removeVote();
    },

    removeVote: function() {
        VoteAction.unvote(
            this.state.blockchainAccounts.getKeystoreByBillId(this.props.bill.id),
            this.props.bill.id
        );
    },

    voterCardReaderCancelled: function() {
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
                        billId={this.props.bill.id}
                        onSuccess={this.voterCardReaderSuccess}
                        onCancel={this.voterCardReaderCancelled}/>
                    : <span/>}
            </Button>
		);
	}
});

module.exports = RemoveMyVoteButton;
