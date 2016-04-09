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

var UnvoteButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getInitialState: function() {
        return {
            showProofOfVoteReader: false
        };
    },

    handleClick: function()
    {
        this.setState({
            showProofOfVoteReader: true
        });
    },

    componentWillUnmount: function() {
        this._unsubscribe();
    },

    proofOfVoteReaderSuccess: function(data) {
        this.setState({
            showProofOfVoteReader: false,
            unvoting: true
        });

        VoteAction.unvote(this.props.bill.id);

        this._unsubscribe = BallotStore.listen((store) => {
            var ballot = this.ballots.getBallotByBillId(this.props.billId);

            if (!!ballot && ballot.error == 'removed')
                this._unsubscribe();
        });
    },

    proofOfVoteReaderCancelled: function() {
        this.setState({
            showProofOfVoteReader: false
        });
    },

    render: function()
    {
		return (
            this.state.unvoting
                ? <LoadingIndicator text={this.getIntlMessage('vote.REMOVING_VOTE')}/>
                : this.state.showProofOfVoteReader
                    ? <ProofOfVoteReader onSuccess={this.proofOfVoteReaderSuccess}
                        onCancel={this.proofOfVoteReaderCancelled}/>
                    : <Button onClick={this.handleClick} className="btn-unvote">
                        <FormattedMessage message={this.getIntlMessage('vote.UNVOTE')}/>
                    </Button>
		);
	}
});

module.exports = UnvoteButton;
