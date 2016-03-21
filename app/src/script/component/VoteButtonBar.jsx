var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var VoteButton = require('./VoteButton'),
    UnvoteButton = require('./UnvoteButton'),
    LoadingIndicator = require('./LoadingIndicator');

var ServiceStatusAction = require('../action/ServiceStatusAction');

var ServiceStatusStore = require('../store/ServiceStatusStore'),
    ConfigStore = require('../store/ConfigStore'),
    BallotStore = require('../store/BallotStore');

var ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var VoteButtonBar = React.createClass({

    mixins: [
        Reflux.connect(ConfigStore, 'config'),
        Reflux.connect(ServiceStatusStore, 'serviceStatus'),
        Reflux.connect(BallotStore, 'ballots'),
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        BillAction.showCurrentUserVote(this.props.bill.id);
        if (this.props.bill.voteContractAddress)
            ServiceStatusAction.showStatus();
    },

    componentDidMount: function()
    {
        this.listenTo(VoteAction.vote, (billId) => {
            BillAction.show(this.props.bill.id);
            this.startPollingBallot();
        });
    },

    startPollingBallot: function()
    {
        if (!!this._ballotPollingInterval)
            return;

        this._ballotPollingInterval = setInterval(
            () => {
                var ballot = this.state.ballots
                    ? this.state.ballots.getBallotByBillId(this.props.bill.id)
                    : null;

                if (ballot && (ballot.status == 'complete' || ballot.error == 404))
                    this.stopPollingBallot();
                else
                    BillAction.showCurrentUserVote(this.props.bill.id, true);
            },
            10000
        );
    },

    stopPollingBallot: function()
    {
        if (this._ballotPollingInterval)
        {
            clearInterval(this._ballotPollingInterval);
            this._ballotPollingInterval = false;
        }
    },

    componentWillUnmount: function()
    {
        this.stopPollingBallot();
    },

    renderVoteButtons: function()
    {
        return (
            <ButtonToolbar className="bill-center">
                <VoteButton message="bill.VOTE_YES"
                    bill={this.props.bill.id}
                    value="yes"
                    className="btn-vote-yes"/>
                <VoteButton message="bill.VOTE_BLANK"
                    bill={this.props.bill.id}
                    value="blank"
                    className="btn-vote-blank"/>
                <VoteButton message="bill.VOTE_NO"
                    bill={this.props.bill.id}
                    value="no"
                    className="btn-vote-no"/>
            </ButtonToolbar>
        );
    },

    render: function()
    {
        var bill = this.props.bill;
        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;
        var validBallot = ballot && !ballot.error && ballot.status == 'complete'
            && ballot.value;

        if (ballot && ballot.status != 'complete')
            this.startPollingBallot();

        return (
            <div className={validBallot ? 'voted-' + ballot.value : ''}>
                <Grid>
                    <Row className="section section-no-border section-vote">
                        <Col md={12}>
                            <h2 className="section-title">
                                {this.getIntlMessage('bill.YOUR_VOTE')}
                                {!!bill.voteContractAddress
                                    ? <span className="small">
                                        <span className="icon-secured"/>
                                        {this.getIntlMessage('bill.BLOCKCHAIN_SECURED')}
                                    </span>
                                    : <span/>}
                            </h2>
                            {this.renderChildren()}
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    },

    renderChildren: function()
    {
        var bill = this.props.bill;
        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;

        if (!this.isAuthenticated())
        {
            if (bill.status != 'published')
            {
                return (
                    <p className="hint">
                        {this.renderLoginMessage(this.getIntlMessage('bill.LOGIN_REQUIRED'))}
                    </p>
                );
            }
            else
            {
                return (
                    <p className="hint">
                        {this.getIntlMessage('bill.TOO_LATE_TO_VOTE')}
                    </p>
                );
            }
        }

        if (this.props.bill.voteContractAddress && !this.state.serviceStatus)
            return <LoadingIndicator/>;

        if (ballot && ballot.status == 'error')
            return (
                <div>
                    <p>Error</p>
                    <UnvoteButton bill={bill}/>
                </div>
            );

        var system = this.state.serviceStatus
            ? this.state.serviceStatus.getSystemStatus()
            : null;

		return (
            <div>
                {bill.voteContractAddress && (!system.blockchainNode || !system.blockchainMiner)
                    ? <span>
                        {this.getIntlMessage('bill.VOTE_UNAVAILABLE')}
                    </span>
                    : !this.state.config.capabilities.bill.vote
                        ? <p className="hint">
                            {this.getIntlMessage('bill.VOTE_DISABLED')}
                        </p>
                        : !ballot || ballot.error == 404 || ballot.status != 'complete'
                            ? bill.status == 'vote'
                                ? !!ballot && (ballot.status && ballot.status != 'complete')
                                    ? <LoadingIndicator text={this.getIntlMessage('bill.VOTE_PENDING')}/>
                                    : this.renderVoteButtons()
                                : <p className="hint">
                                    {this.getIntlMessage('bill.TOO_LATE_TO_VOTE')}
                                </p>
                            : <div>
                                <FormattedMessage message={this.getIntlMessage('bill.ALREADY_VOTED')}
                                    value={ballot && ballot.value ? this.getIntlMessage('bill.VOTE_' + ballot.value.toUpperCase()) : ''}
                                    date={<FormattedTime value={ballot && ballot.time ? ballot.time : Date.now()}/>}/>
                                {bill.status == 'vote'
                                    ? <div>
                                        <UnvoteButton bill={bill}/>
                                    </div>
                                    : <div/>}
                            </div>}
            </div>
		);
	}
});

module.exports = VoteButtonBar;
