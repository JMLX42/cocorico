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
    Hint = require('./Hint'),
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
        // BillAction.showCurrentUserVote(this.props.bill.id);
        if (this.props.bill.voteContractAddress)
            ServiceStatusAction.showStatus();
    },

    componentDidMount: function()
    {
        this.listenTo(VoteAction.vote, (billId) => {
            BillAction.show(this.props.bill.id);
        });
    },

    componentWillUnmount: function()
    {
        VoteAction.stopPollingBallot(this.props.bill.id);
    },

    renderVoteButtons: function()
    {
        return (
            <ButtonToolbar className="bill-center">
                <VoteButton message="bill.VOTE_YES"
                    bill={this.props.bill.id}
                    value="yes"
                    className="btn-positive"/>
                <VoteButton message="bill.VOTE_BLANK"
                    bill={this.props.bill.id}
                    value="blank"
                    className="btn-neutral"/>
                <VoteButton message="bill.VOTE_NO"
                    bill={this.props.bill.id}
                    value="no"
                    className="btn-negative"/>
            </ButtonToolbar>
        );
    },

    render: function()
    {
        if (this.isAuthenticated())
            VoteAction.startPollingBallot(this.props.bill.id);

        var bill = this.props.bill;
        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;
        var validBallot = ballot && !ballot.error && ballot.status == 'complete'
            && ballot.value;

        return (
            <div className={validBallot ? 'voted-' + ballot.value : ''}>
                <Grid className="section section-vote">
                    <Row>
                        <Col md={12}>
                            <h2>
                                {this.getIntlMessage('bill.YOUR_VOTE')}
                                {!!bill.voteContractAddress
                                    ? <span className="small">
                                        <span className="icon-secured"/>
                                        {this.getIntlMessage('bill.BLOCKCHAIN_SECURED')}
                                    </span>
                                    : <span/>}
                            </h2>
                        </Col>
                    </Row>

                    {!validBallot && bill.status == 'vote'
                        ? <Row>
                            <Col md={12}>
                                <Hint pageSlug="astuce-etape-vote"
                                    disposable={true}/>
                            </Col>
                        </Row>
                        : <div/>}

                    <Row>
                        <Col md={12}>
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

        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;

        // If the app takes some time to retrieve the ballot (ex: busy server),
        // then we *need* to wait: if the ballot does not exist, it will still
        // load and create a ballot object with the 404 error code anyway. So
        // the case where the ballot object does not exist at all should not
        // happen and we should just wait.
        if (!ballot)
            return <LoadingIndicator/>;

        if (this.props.bill.voteContractAddress && !this.state.serviceStatus
            && ballot.status != 'complete')
            return <LoadingIndicator/>;

        if (ballot && ballot.status == 'error')
            return (
                <div>
                    <p>Error</p>
                    <UnvoteButton bill={bill}/>
                </div>
            );

        var systemStatus = this.state.serviceStatus
            ? this.state.serviceStatus.getSystemStatus()
            : null;

		return (
            <div>
                {bill.voteContractAddress && (!systemStatus || !systemStatus.blockchainNode || !systemStatus.blockchainMiner)
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
