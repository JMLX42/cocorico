var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var UnvoteButton = require('./UnvoteButton'),
    Hint = require('./Hint'),
    LoadingIndicator = require('./LoadingIndicator'),
    VoteWidget = require('./VoteWidget');

var ServiceStatusAction = require('../action/ServiceStatusAction');

var ServiceStatusStore = require('../store/ServiceStatusStore'),
    ConfigStore = require('../store/ConfigStore'),
    BallotStore = require('../store/BallotStore');

var ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Button = ReactBootstrap.Button,
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

    getInitialState: function()
    {
        return {
            voting: false
        };
    },

    componentWillMount: function()
    {
        ServiceStatusAction.showStatus();
        VoteAction.startPollingBallot(this.props.bill.id)
    },

    componentDidMount: function()
    {
        this.listenTo(VoteAction.vote, (billId) => {

        });

        BallotStore.listen((store) => {
            var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);

            if (!!ballot && ballot.status == 'pending')
                this.setState({voting:true});
        });
    },

    componentWillUnmount: function()
    {
        VoteAction.stopPollingBallot(this.props.bill.id);
    },

    startVotingProcess: function(vote)
    {
        this.setState({
            vote: vote,
            voting: true
        });
    },

    renderVoteButtons: function()
    {
        return (
            <div>
                <ButtonToolbar className="bill-center">
                    <Button bsSize="large" className="btn-vote btn-positive"
                        onClick={(e)=>this.startVotingProcess(0)}>
                        <span className="icon-thumb_up"/>
                        <FormattedMessage message={this.getIntlMessage('vote.VOTE')}
                            value={this.getIntlMessage('vote.VOTE_YES')}/>
                    </Button>
                    <Button bsSize="large" className="btn-vote btn-neutral"
                        onClick={(e)=>this.startVotingProcess(1)}>
                        <span className="icon-stop"/>
                        <FormattedMessage message={this.getIntlMessage('vote.VOTE')}
                            value={this.getIntlMessage('vote.VOTE_BLANK')}/>
                    </Button>
                    <Button bsSize="large" className="btn-vote btn-negative"
                        onClick={(e)=>this.startVotingProcess(2)}>
                        <span className="icon-thumb_down"/>
                        <FormattedMessage message={this.getIntlMessage('vote.VOTE')}
                            value={this.getIntlMessage('vote.VOTE_NO')}/>
                    </Button>
                </ButtonToolbar>
                <Hint pageSlug="astuce-etape-vote" disposable={true}/>
            </div>
        );
    },

    renderAlreadyVotedMessage: function()
    {
        var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);

        return (
            <div>
                <p>
                    <FormattedMessage
                        message={this.getIntlMessage('vote.ALREADY_VOTED')}
                        date={<FormattedTime value={ballot.time}/>}/>
                </p>
                <UnvoteButton bill={this.props.bill}/>
            </div>
        );
    },

    renderVoteWidget: function()
    {
        return (
            <div>
                <VoteWidget bill={this.props.bill}
                    vote={this.state.vote}
                    visible={this.state.voting}
                    onCancel={(e)=>this.setState({voting:false})}
                    onComplete={(e)=>this.setState({voting:false})}/>
                <p>
                    {this.getIntlMessage('vote.VOTE_PENDING')}
                </p>
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
                        {this.renderLoginMessage(this.getIntlMessage('vote.LOGIN_REQUIRED'))}
                    </p>
                );
            }
            else
            {
                return (
                    <p className="hint">
                        {this.getIntlMessage('vote.TOO_LATE_TO_VOTE')}
                    </p>
                );
            }
        }

        // If the app takes some time to retrieve the ballot (ex: busy server),
        // then we *need* to wait: if the ballot does not exist, it will still
        // load and create a ballot object with the 404 error code anyway. So
        // the case where the ballot object does not exist at all should not
        // happen and we should just wait.
        var ballot = this.state.ballots.getBallotByBillId(bill.id);
        if (!ballot)
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

        if (ballot.status != 'complete')
        {
            if (!systemStatus)
                return <LoadingIndicator/>;

            if (bill.voteContractAddress && (!systemStatus || !systemStatus.blockchainNode || !systemStatus.blockchainMiner))
                return (
                    <Hint style="danger">
                        <h3>
                            {this.getIntlMessage('vote.VOTE_UNAVAILABLE')}
                        </h3>
                    </Hint>
                );

            if (!this.state.config.capabilities.bill.vote)
                return (
                    <Hint style="danger">
                        <p>
                            {this.getIntlMessage('vote.VOTE_DISABLED')}
                        </p>
                    </Hint>
                );
        }

        return (
            <div>
                <Row>
                    <Col md={12}>
                        {this.state.voting
                            ? this.renderVoteWidget()
                            : !!ballot && ballot.status == 'complete'
                                ? this.renderAlreadyVotedMessage()
                                : this.renderVoteButtons()}
                    </Col>
                </Row>
            </div>
        );
    },

    render: function()
    {
        if (this.isAuthenticated())
            VoteAction.startPollingBallot(this.props.bill.id);

		return (
            <div>
                <Grid className="section section-vote" id="vote-widget">
                    <Row>
                        <Col md={12}>
                            <h2>
                                {this.getIntlMessage('vote.YOUR_VOTE')}
                            </h2>
                        </Col>
                    </Row>
                    {this.renderChildren()}
                </Grid>
            </div>
		);
	}
});

module.exports = VoteButtonBar;
