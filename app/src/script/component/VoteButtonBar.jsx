var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var classNames = require('classnames');

var BillAction = require('../action/BillAction'),
    VoteAction = require('../action/VoteAction');

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var RemoveMyVoteButton = require('./RemoveMyVoteButton'),
    Hint = require('./Hint'),
    LoadingIndicator = require('./LoadingIndicator'),
    VoteWidget = require('./VoteWidget'),
    Title = require('./Title');

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
            voting: false,
            showVoterCardReader: false,
            proofOfVoteSuccess: false,
            removingVote: false
        };
    },

    componentWillMount: function()
    {
        ServiceStatusAction.showStatus();
    },

    componentDidMount: function()
    {
        this.listenTo(VoteAction.vote, (billId) => {

        });

        this.listenTo(VoteAction.unvote, (billId) => {
            if (billId == this.props.bill.id) {
                this.setState({removingVote:true});
            }
        });

        // BallotStore.listen((store) => {
            // var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);
            //
            // if (!!ballot && ballot.status == 'pending')
            //     this.setState({voting:true});
        // });
    },

    componentWillUnmount: function()
    {
        VoteAction.stopPollingBallot(this.props.bill.id);
    },

    startVotingProcess: function(vote)
    {
        this.setState({
            vote: vote,
            voting: true,
            removingVote: false
        });
    },

    renderVoteButtons: function()
    {
        return (
            <div>
                <ButtonToolbar className="bill-center">
                    <a className="btn btn-lg btn-vote btn-positive"
                        onClick={(e)=>this.startVotingProcess(0)}>
                        <span className="icon-thumb_up"/>
                        <FormattedMessage message={this.getIntlMessage('vote.VOTE')}
                            value={this.getIntlMessage('vote.VOTE_YES')}/>
                    </a>
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

    renderVoteStatusMessage: function()
    {
        var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);

        return (
            <div>
                <p className="lead">
                    <FormattedMessage
                        message={this.getIntlMessage('vote.ALREADY_VOTED')}
                        date={<FormattedTime value={ballot.time}/>}/>
                </p>
                {ballot.status == 'queued' || ballot.status == 'pending'
                    || ballot.status == 'initialized' || ballot.status == 'registered'
                    ? this.renderVoteRecordingMessage()
                    : <span/>}
                {!!ballot && ballot.status == 'complete'
                    ? this.state.removingVote
                        ? <LoadingIndicator text={this.getIntlMessage('vote.REMOVING_VOTE')}/>
                        : <ButtonToolbar>
                            <RemoveMyVoteButton bill={this.props.bill}/>
                            <RemoveMyVoteButton bill={this.props.bill}
                                value={this.getIntlMessage('vote.CHANGE_MY_VOTE')}/>
                        </ButtonToolbar>
                    : <span/>}
            </div>
        );
    },

    renderVoteWidget: function()
    {
        return (
            <div>
                <p>
                    {this.getIntlMessage('vote.VOTE_PENDING')}
                </p>
                <VoteWidget bill={this.props.bill}
                    vote={this.state.vote}
                    visible={this.state.voting}
                    onCancel={(e)=>this.setState({voting:false})}
                    onComplete={(e)=>this.setState({voting:false})}/>
            </div>
        );
    },

    getVoteValueDisplayMessage: function()
    {
        var voteDisplay = [
            this.getIntlMessage('vote.VOTE_YES'),
            this.getIntlMessage('vote.VOTE_BLANK'),
            this.getIntlMessage('vote.VOTE_NO')
        ];

        return voteDisplay[this.state.vote];
    },

    renderVoteRecordingMessage: function()
    {
        var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);

        return (
            <div>
                <p>
                    <LoadingIndicator text={
                        <FormattedMessage
                            message={this.getIntlMessage('vote.YOUR_VOTE_IS_BEING_RECORDED')}
                            value={
                                <strong>
                                    <span className={classNames({
                                            'positive': this.state.vote == 0,
                                            'neutral': this.state.vote == 1,
                                            'negative': this.state.vote == 2
                                        })}>
                                    {this.getVoteValueDisplayMessage()}
                                    </span>
                                </strong>
                            }
                            bill={
                                <strong>
                                    <Title text={this.props.bill.title}/>
                                </strong>
                            }/>
                        }/>
                </p>
                <Hint pageSlug="astuce-enregistrement-du-vote" disposable={true}/>
            </div>
        );
    },

    renderChildren: function()
    {
        var bill = this.props.bill;

        if (bill.status == 'published')
        {
            return (
                <p className="hint">
                    {this.getIntlMessage('vote.TOO_LATE_TO_VOTE')}
                </p>
            );
        }

        if (!this.isAuthenticated())
        {
            return (
                <p className="hint">
                    {this.renderLoginMessage(this.getIntlMessage('vote.LOGIN_REQUIRED'))}
                </p>
            );
        }
        else
        {
            VoteAction.startPollingBallot(this.props.bill.id);
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
                    <RemoveMyVoteButton bill={bill} proofOfVoteRequired={false}/>
                </div>
            );

        var systemStatus = this.state.serviceStatus
            ? this.state.serviceStatus.getSystemStatus()
            : null;

        if (ballot.status != 'complete')
        {
            // if (!systemStatus)
            //     return <LoadingIndicator/>;
            //
            // if (bill.voteContractAddress && (!systemStatus || !systemStatus.blockchainNode || !systemStatus.blockchainMiner))
            //     return (
            //         <Hint style="danger">
            //             <h3>
            //                 {this.getIntlMessage('vote.VOTE_UNAVAILABLE')}
            //             </h3>
            //         </Hint>
            //     );
            //
            // if (!this.state.config.capabilities.bill.vote)
            //     return (
            //         <Hint style="danger">
            //             <p>
            //                 {this.getIntlMessage('vote.VOTE_DISABLED')}
            //             </p>
            //         </Hint>
            //     );
        }

        return (
            this.state.voting
                ? this.renderVoteWidget()
                : !!ballot && !!ballot.status
                    ? this.renderVoteStatusMessage()
                    : this.renderVoteButtons()
        );
    },

    render: function()
    {
        if (this.isAuthenticated())
            VoteAction.startPollingBallot(this.props.bill.id);

		return this.renderChildren();
	}
});

module.exports = VoteButtonBar;
