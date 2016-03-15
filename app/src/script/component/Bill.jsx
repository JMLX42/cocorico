var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var StringHelper = require('../helper/StringHelper');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillAction = require('../action/BillAction'),
    UserAction = require('../action/UserAction'),
    VoteAction = require('../action/VoteAction');

var VoteButtonBar = require('./VoteButtonBar'),
    LoginButton = require('./LoginButton'),
    UnvoteButton = require('./UnvoteButton'),
    ArgumentEditor = require('./ArgumentEditor'),
    ArgumentTab = require('./ArgumentTab'),
    ContributionTabs = require('./ContributionTabs'),
    LikeButtons = require('./LikeButtons'),
    Hint = require('./Hint'),
    VoteResult = require('./VoteResult'),
    BillRenderer = require('./BillRenderer'),
    Title = require('./Title');

var BallotStore = require('../store/BallotStore'),
    UserStore = require('../store/UserStore'),
    BillStore = require('../store/BillStore'),
    SourceStore = require('../store/SourceStore'),
    ConfigStore = require('../store/ConfigStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab,
    Button = ReactBootstrap.Button;

var Bill = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(BillStore, 'bills'),
        Reflux.connect(BallotStore, 'ballots'),
        Reflux.connect(SourceStore, 'sources'),
        Reflux.connect(ConfigStore, 'config')
    ],

    componentWillMount: function()
    {
        BillAction.showCurrentUserVote(this.props.bill.id);
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
                {
                    this.stopPollingBallot();
                    this._ballotPollingInterval = false;
                }
                else
                {
                    BillAction.showCurrentUserVote(this.props.bill.id, true);
                }
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

    componentWillReceiveProps: function(nextProps)
    {
        if (nextProps.bill.id != this.props.bill.id)
            BillAction.showById(nextProps.bill.id);
    },

    componentWillUnmount: function()
    {
        this.stopPollingBallot();
    },

    render: function()
    {
        var bill = this.props.bill;

        if (!bill || !bill.likes || !bill.parts)
            return null;

        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;

        if (ballot && ballot.status == 'pending')
            this.startPollingBallot(bill.id);

        var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByBillId(bill.id)
            : [];

        var showContributionTab = this.state.config.capabilities.source.read
            || this.state.config.capabilities.argument.read
            || this.state.config.capabilities.proposal.read;

		return (
            <ReactDocumentTitle title={StringHelper.toTitleCase(bill.title) + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="bill">
                    <Grid>
                        <Row className="section">
                            <Col md={12}>
                                <h1 className="bill-title"><Title text={bill.title}/></h1>
                                {this.state.config.capabilities.bill.favorite
                                    ? <LikeButtons likeAction={BillAction.like} resource={bill}/>
                                    : <span/>}
                            </Col>
                        </Row>

                        <Row className="section">
                            <Col md={12}>
                                <div className="bill-content">
                                    {!!bill && !!sources
                                        ? <BillRenderer bill={bill} sources={sources} editable={bill.status == 'review'}/>
                                        : <div/>
                                    }
                                </div>
                            </Col>
                        </Row>
                    </Grid>

                    {bill.status == 'review'
                        ? <div className="section section-hint cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <Hint pageSlug="astuce-etape-revision"
                                            disposable={true}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {bill.status == 'debate'
                        ? <div className="section section-hint cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <Hint pageSlug="astuce-etape-debat"
                                            disposable={true}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {showContributionTab
                        ? <Grid>
                            <Row className="section" style={{border:'none'}}>
                                <ContributionTabs bill={bill} editable={true} tab={this.props.tab}/>
                            </Row>
                        </Grid>
                        : <div/>}

                    {bill.status == 'vote'
                        ? <div className="section section-hint cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <Hint pageSlug="astuce-etape-vote"
                                            disposable={true}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {bill.status == 'vote' || bill.status == 'published'
                        ? <div className={this.state.ballots && ballot && !ballot.error && ballot.status == 'complete' && ballot.value ? 'voted-' + ballot.value : ''}>
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
                                        <VoteButtonBar bill={bill} ballot={ballot}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {bill.status == 'published'
                        ? <VoteResult billId={bill.id}/>
                        : <div/>}
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = Bill;
