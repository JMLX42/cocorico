var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteAction = require('../action/VoteAction');

var BlockchainAccountStore = require('../store/BlockchainAccountStore'),
    ConfigStore = require('../store/ConfigStore');

var VoterCardReaderModal = require('./VoterCardReaderModal'),
    LoadingIndicator = require('./LoadingIndicator');

var FormattedMessage = ReactIntl.FormattedMessage;

var Button = ReactBootstrap.Button;

var RemoveMyVoteButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
        Reflux.connect(ConfigStore, 'config')
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
        if (!!this._blockchainAccStoreUnsub)
            this._blockchainAccStoreUnsub();
    },

    voterCardReaderSuccess: function(data) {
        this.setState({
            showVoterCardReader: false,
            unvoting: true
        });

        this._blockchainAccStoreUnsub = BlockchainAccountStore.listen(
            () => this.removeVote()
        );

        this.removeVote();
    },

    removeVote: function() {
        var keystore = this.state.blockchainAccounts.getKeystoreByBillId(this.props.bill.id);

        if (!keystore)
            return;

        this._blockchainAccStoreUnsub();

        var key = this.state.blockchainAccounts.getPwDerivedKeyByBillId(this.props.bill.id);
        var address = this.state.blockchainAccounts.getAddressByBillId(this.props.bill.id);

        console.log(keystore, key, address);

        VoteAction.unvote(keystore, key, address, this.props.bill);
    },

    voterCardReaderCancelled: function() {
        this.setState({
            showVoterCardReader: false
        });
    },

    render: function()
    {
        if (!this.state.config.capabilities.vote.cancel)
            return null;

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
