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
    Title = require('./Title'),
    LoadingIndicator = require('./LoadingIndicator');

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

    componentWillReceiveProps: function(nextProps)
    {
        if (nextProps.bill.id != this.props.bill.id)
            BillAction.show(nextProps.bill.id);
    },

    render: function()
    {
        var bill = this.props.bill;
        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByBillId(bill.id)
            : null;

        if ((!bill || !bill.likes || !bill.parts) && !ballot)
            return (
                <Grid>
                    <Row className="section">
                        <Col md={12}>
                            <LoadingIndicator/>
                        </Col>
                    </Row>
                </Grid>
            );

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
                        <Row className="section section-title">
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
                        ? <div className="section section-hint">
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
                        ? <div className="section section-hint">
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
                            <Row>
                                <Col md={12}>
                                    <h2>
                                        {this.getIntlMessage('bill.CONTRIBUTIONS')}
                                    </h2>
                                </Col>
                            </Row>
                            <Row className="section section-contributions">
                                <ContributionTabs bill={bill} editable={true} tab={this.props.tab}/>
                            </Row>
                        </Grid>
                        : <div/>}

                    {bill.status == 'vote' || bill.status == 'published'
                        ? <VoteButtonBar bill={bill}/>
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
