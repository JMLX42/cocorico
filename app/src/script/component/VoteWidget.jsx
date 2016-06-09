var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');
var jquery = require('jquery');
var classNames = require('classnames');

var Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    ProgressBar = ReactBootstrap.ProgressBar,
    Modal = ReactBootstrap.Modal;

var Link = ReactRouter.Link;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime,
    FormattedHTMLMessage = ReactIntl.FormattedHTMLMessage;

var VoteAction = require('../action/VoteAction'),
    BlockchainAccountAction = require('../action/BlockchainAccountAction');

var LoadingIndicator = require('./LoadingIndicator'),
    Hint = require('./Hint'),
    Countdown = require('./Countdown'),
    Title = require('./Title'),
    Page = require('./Page'),
    VoterCard = require('./VoterCard'),
    VoterCardDownloadButton = require('./VoterCardDownloadButton'),
    VoterCardPrintButton = require('./VoterCardPrintButton'),
    VoterCardReader = require('./VoterCardReader');

var ConfigStore = require('../store/ConfigStore'),
    BallotStore = require('../store/BallotStore'),
    // UserStore = require('../store/UserStore'),
    BlockchainAccountStore = require('../store/BlockchainAccountStore');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var VoteWidget = React.createClass({

    mixins: [
        Reflux.connect(ConfigStore, 'config'),
        Reflux.connect(BallotStore, 'ballots'),
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
        // Reflux.connect(UserStore, 'users'),
        ForceAuthMixin,
        ReactIntl.IntlMixin
    ],

    statics: {
        STEP_VOTER_ID:      0,
        STEP_VOTE_CARD:    1,
        STEP_CONFIRM:       2,
        STEP_COMPLETE:      3,
        STEP_ERROR:         4,

        COUNTDOWN:          10
    },

    getInitialState: function()
    {
        return {
            vote: this.props.vote,
            step: 0,
            blockchainAccountCreated: false,
            confirmVoteButtonEnabled: false,
            skipVoterCardButtonEnabled: false,
            fetchedVoterCard: false
        };
    },

    getDefaultProps: function()
    {
        return {
            onCancel: (e) => {},
            onComplete: (e) => {}
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        this.setState({
            visible: nextProps.visible,
            vote: this.props.vote
        });
    },

    goToBallotStep: function(ballot)
    {
        if (!ballot) {
            return ;
        }

        if (ballot.error) {
            // FIXME: this.goToStep(VoteWidget.STEP_ERROR)
            return;
        }

        if (ballot.status == 'complete') {
            return this.goToStep(VoteWidget.STEP_COMPLETE);
        }
        if (ballot.status == 'pending') {
            return this.goToStep(VoteWidget.STEP_COMPLETE);
        }
    },

    componentWillMount: function()
    {
        this.checkBallot();
        this._ballotStoreUnsubscribe = BallotStore.listen(
            (store) => this.checkBallot()
        );
        // this._blockchainAccountStoreUnsubscribe = BlockchainAccountStore.listen(
        //     (store) => this.goToStep(VoteWidget.STEP_CONFIRM)
        // );
    },

    componentDidMount: function()
    {
        // this.listenTo(VoteAction.unvote, (billId) => {
        //     this.goToStep(VoteWidget.STEP_CONFIRM);
        // });
    },

    componentWillUnmount: function()
    {
        this.goToStep(0);

        this._ballotStoreUnsubscribe();
        // this._blockchainAccountStoreUnsubscribe();

        window.onbeforeunload = null;

        delete this._completeTimeout;
    },

    checkBallot: function()
    {
        var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);

        if (!!ballot && this.state.ballotStatus != ballot.status)
        {
            this.setState({
                ballotStatus: ballot.status,
                ballotProgressOffset: 0.0
            });
        }

        this.goToBallotStep(ballot);
    },

    proofOfVoteDownloaded: function()
    {
        this.setState({fetchedVoterCard: true});
        if (this.state.step == VoteWidget.STEP_VOTE_CARD) {
            this.goToNextStep();
        }
    },

    proofOfVotePrinted: function()
    {
        this.setState({fetchedVoterCard: true});
        if (this.state.step == VoteWidget.STEP_VOTE_CARD) {
            this.goToNextStep();
        }
    },

    confirmVoteValue: function()
    {
        var keystore = this.state.blockchainAccounts.getKeystoreByBillId(
            this.props.bill.id
        );
        var pwDerivedKey = this.state.blockchainAccounts.getPwDerivedKeyByBillId(
            this.props.bill.id
        );
        var address = this.state.blockchainAccounts.getAddressByBillId(
            this.props.bill.id
        );

        VoteAction.vote(keystore, pwDerivedKey, address, this.props.bill, this.state.vote);
        this.setState({confirmedVote:true});
        // this.goToNextStep();
    },

    createNewVoterCard: function()
    {
        this.setState({blockchainAccountCreated:true});
        BlockchainAccountAction.create(this.props.bill.id);
    },

    setVoteValue: function(value)
    {
        this.setState({
            vote: value
        });
        this.goToNextStep();
    },

    goToStep: function(step)
    {
        if (step != this.state.step) {
            this.setState({step: step});

            if (step < 0) {
                this.setState(this.getInitialState());
            }
        }
    },

    goToPreviousStep: function()
    {
        this.goToStep(this.state.step - 1);
    },

    goToNextStep: function()
    {
        this.goToStep(this.state.step + 1);
    },

    renderProgressBar: function()
    {
        var voterCard = this.state.blockchainAccounts.getVoterCardByBillId(
            this.props.bill.id
        );

        return (
            <div>
                <Grid>
                    <Row>
                        <Col xs={3} className="vote-step-progress">
                            <ProgressBar now={100}
                                style={{borderRight:'1px solid white',borderRadius:0}}/>
                        </Col>
                        <Col xs={3} className="vote-step-progress">
                            <ProgressBar now={this.state.step >= VoteWidget.STEP_VOTE_CARD ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}
                                active={this.state.step == VoteWidget.STEP_VOTE_CARD && this.state.blockchainAccountCreated && !voterCard}
                                stripped={this.state.step == VoteWidget.STEP_VOTE_CARD && this.state.blockchainAccountCreated && !voterCard}/>
                        </Col>
                        <Col xs={3} className="vote-step-progress">
                            <ProgressBar now={this.state.step >= VoteWidget.STEP_CONFIRM ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}
                                active={this.state.step == VoteWidget.STEP_CONFIRM && this.state.confirmedVote}
                                stripped={this.state.step == VoteWidget.STEP_CONFIRM && this.state.confirmedVote}/>
                        </Col>
                        <Col xs={3} className="vote-step-progress">
                            <ProgressBar now={this.state.step >= VoteWidget.STEP_COMPLETE ? 100 : 0}
                                style={{borderRadius:0}}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={3}>
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_VOTER_ID,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTER_ID,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_VOTER_ID
                                })}>
                                <div className="vote-step-number">1</div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_1_NAME')}
                                </span>
                            </div>
                        </Col>
                        <Col sm={3}>
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_VOTE_CARD,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTE_CARD,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_VOTE_CARD
                                })}>
                                <div className="vote-step-number">2</div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_2_NAME')}
                                </span>
                            </div>
                        </Col>
                        <Col sm={3}>
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_CONFIRM,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_CONFIRM,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_CONFIRM
                                })}>
                                <div className="vote-step-number">3</div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_3_NAME')}
                                </span>
                            </div>
                        </Col>
                        <Col sm={3}>
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_COMPLETE,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_COMPLETE,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_COMPLETE
                                })}>
                                <div className="vote-step-number">4</div>
                                    <span className="vote-step-name">
                                        {this.getIntlMessage('vote.STEP_4_NAME')}
                                    </span>
                            </div>
                        </Col>
                    </Row>
                </Grid>
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

    renderVoterCardPrintButton: function(className)
    {
        if (!this.state.config.capabilities.vote_card.print)
            return null;

        return (
            <VoterCardPrintButton
                className={className ? className : 'btn btn-primary'}
                billId={this.props.bill.id}
                onClick={this.proofOfVotePrinted}/>
        );
    },

    renderVoterCardDownloadButton: function(className)
    {
        if (!this.state.config.capabilities.vote_card.download)
            return null;

        // var ballot = this.state.ballots.getBallotByBillId(this.props.bill.id);
        // var date = new Date(ballot.time);
        var date = new Date();
        var filename = 'cocorico_' + this.props.bill.title
            + '_'  + date.toLocaleDateString()
            + '_'  + date.toLocaleTimeString()
            + '.svg';

        filename = filename
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/[:\/]/g, '');

        return (
            <VoterCardDownloadButton
                filename={filename}
                className={className ? className : 'btn btn-primary'}
                billId={this.props.bill.id}
                onClick={this.proofOfVoteDownloaded}/>
        );
    },

    renderVoterIdDialog: function()
    {
        var user = this.state.users.getCurrentUser();
        var birthdate = new Date(user.birthdate);

        return (
            <div className="vote-step-description">
                <Page slug="vote-carte-didentite"/>
                <p>
                    <FormattedHTMLMessage
                        message={this.getIntlMessage('vote.ANNOUNCE_VOTER_ID')}
                        name={user.firstName + ' ' + user.lastName}
                        birthdate={birthdate.toLocaleDateString()}/> :
                </p>
                <ButtonToolbar className="vote-step-actions">
                    <Button bsStyle="primary" onClick={(e)=>this.goToNextStep()}>
                        <FormattedMessage
                            message={this.getIntlMessage('vote.CONFIRM_VOTER_ID')}
                            name={user.firstName + ' ' + user.lastName}/>
                    </Button>
                    <a href="/api/auth/logout" className="btn btn-default">
                        <FormattedMessage
                            message={this.getIntlMessage('vote.DENY_VOTER_ID')}/>
                    </a>
                    <Button bsStyle="link"
                        disabled={this.state.blockchainAccountCreated}
                        onClick={(e)=>this.props.onCancel(e)}>
                        {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                    </Button>
                </ButtonToolbar>
                <Hint style="warning" pageSlug="attention-usurpation-didentite"/>
            </div>
        );
    },

    renderVoterCardDialog: function()
    {
        var voterCard = this.state.blockchainAccounts.getVoterCardByBillId(
            this.props.bill.id
        );

        if (this.state.blockchainAccountCreated && !!voterCard) {
            return this.renderDownloadOrPrintVoterCardDialog();
        }

        return (
            <div className="vote-step-description">
                {this.state.showVoterCardReader
                    ? <div>
                        <VoterCardReader billId={this.props.bill.id}
                            onSuccess={(e)=>this.goToNextStep()}/>
                    </div>
                    : <div>
                        <Page slug="vote-carte-de-vote"/>
                        {!this.state.blockchainAccountCreated
                            ? <ButtonToolbar className="vote-step-actions">
                                <Button bsStyle="primary"
                                    onClick={this.createNewVoterCard}>
                                    <FormattedMessage
                                        message={this.getIntlMessage('vote.CREATE_NEW_VOTE_CARD')}/>
                                </Button>
                                <Button bsStyle="default"
                                    onClick={(e)=>this.setState({showVoterCardReader:true})}>
                                    <FormattedMessage
                                        message={this.getIntlMessage('vote.USE_EXISTING_VOTE_CARD')}/>
                                </Button>
                                <Button bsStyle="link"
                                    onClick={(e)=>this.props.onCancel(e)}>
                                    {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                                </Button>
                            </ButtonToolbar>
                            : <ButtonToolbar className="vote-step-actions">
                                <LoadingIndicator text={this.getIntlMessage('vote.CREATING_NEW_VOTE_CARD')}/>
                            </ButtonToolbar>}
                        <Hint pageSlug="astuce-carte-de-vote-a-usage-unique"/>
                    </div>}
            </div>
        );
    },

    renderDownloadOrPrintVoterCardDialog: function()
    {
        window.onbeforeunload = () => this.getIntlMessage('vote.BEFORE_UNLOAD_MESSAGE');

        return (
            <div>
                <div className="vote-step-description">
                    <Page slug="vote-nouvelle-carte-de-vote"/>
                    <ButtonToolbar className="vote-step-actions">
                        {this.renderVoterCardPrintButton()}
                        {this.renderVoterCardDownloadButton()}
                        <Button bsStyle="link"
                            disabled={!this.state.skipVoterCardButtonEnabled}
                            onClick={(e)=>this.goToNextStep()}>
                            <Countdown count={VoteWidget.COUNTDOWN}
                                format={(c) => c
                                    ? this.getIntlMessage('vote.IGNORE') + ' ('
                                        + c + ')'
                                    : this.getIntlMessage('vote.IGNORE') + ' ('
                                        + this.getIntlMessage('vote.NOT_RECOMMENDED')
                                        + ')'}
                                onComplete={()=>this.setState({skipVoterCardButtonEnabled:true})}/>
                        </Button>
                    </ButtonToolbar>
                    <Hint style="warning"
                        pageSlug="attention-recuperer-carte-de-vote-1"/>
                </div>
            </div>
        );
    },

    renderConfirmVoteButton: function()
    {
        return (
            <Button className={classNames({
                    'btn-positive': this.state.vote == 0,
                    'btn-neutral': this.state.vote == 1,
                    'btn-negative': this.state.vote == 2,
                    'btn-vote': true
                })}
                disabled={!this.state.confirmVoteButtonEnabled}
                onClick={(e)=>this.confirmVoteValue()}>
                    <Countdown count={VoteWidget.COUNTDOWN}
                        format={(c) => c == 0
                            ? <FormattedMessage
                                message={this.getIntlMessage('vote.I_CONFIRM_MY_VOTE')
                                    + this.getIntlMessage('vote.VOTE')}
                                value={this.getVoteValueDisplayMessage()}/>
                            : <FormattedMessage
                                message={this.getIntlMessage('vote.I_CONFIRM_MY_VOTE')
                                    + this.getIntlMessage('vote.VOTE') + ' ('
                                    + c + ')'}
                                value={this.getVoteValueDisplayMessage()}/>}
                        onComplete={()=>this.setState({confirmVoteButtonEnabled : true})}/>
            </Button>
        );
    },

    renderConfirmDialog: function()
    {
        return (
            <div>
                <div className="vote-step-description">
                    <p>
                        <FormattedMessage
                            message={this.getIntlMessage('vote.CONFIRM_VOTE_MESSAGE')}
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
                    </p>
                    <ButtonToolbar className="vote-step-actions">
                        {this.state.confirmedVote
                            ? <LoadingIndicator text="Envoi de votre vote en cours..."/>
                            : <div>
                                {this.renderConfirmVoteButton()}
                                <Button bsStyle="link"
                                    onClick={(e)=>this.props.onCancel(e)}>
                                    {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                                </Button>
                            </div>}
                    </ButtonToolbar>
                </div>
                {this.state.skipVoterCardButtonEnabled && !this.state.fetchedVoterCard
                    ? <Hint style="warning"
                        pageSlug="attention-recuperer-carte-de-vote-2">
                        <ButtonToolbar>
                            {this.renderVoterCardPrintButton('btn btn-warning')}
                            {this.renderVoterCardDownloadButton('btn btn-warning')}
                        </ButtonToolbar>
                    </Hint>
                    : <span/>}
            </div>
        );
    },

    renderVoteCompleteDialog: function()
    {
        if (this.state.skipVoterCardButtonEnabled && !this.state.fetchedVoterCard)
            window.onbeforeunload = () => this.getIntlMessage('vote.BEFORE_UNLOAD_MESSAGE');
        else
            window.onbeforeunload = null;

        return (
            <div>
                <div className="vote-step-description">
                    <p>
                        <FormattedMessage
                            message={this.getIntlMessage('vote.YOUR_VOTE_IS_COMPLETE')}
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
                    </p>
                </div>
                {this.state.skipVoterCardButtonEnabled && !this.state.fetchedVoterCard
                    ? <Hint style="warning"
                        pageSlug="attention-recuperer-carte-de-vote-3">
                        <ButtonToolbar>
                            {this.renderVoterCardPrintButton('btn btn-warning')}
                            {this.renderVoterCardDownloadButton('btn btn-warning')}
                        </ButtonToolbar>
                    </Hint>
                    : <span/>}
            </div>
        );
    },

    complete: function(e)
    {
        window.onbeforeunload = null;
        // this.goToStep(VoteWidget.STEP_INIT);
        // this.setState({voteModalClosed:true});
        this.props.onComplete(e);
    },

    getStepTitle: function()
    {
        var stepTitles = [
            this.getIntlMessage('vote.STEP_1_TITLE'),
            this.getIntlMessage('vote.STEP_2_TITLE'),
            this.getIntlMessage('vote.STEP_3_TITLE'),
            this.getIntlMessage('vote.STEP_4_TITLE')
        ];

        return (
            <FormattedMessage message={this.getIntlMessage('vote.STEP_TITLE')}
                step={this.state.step + 1}
                total="4"
                title={stepTitles[this.state.step]}/>
        );
    },

    renderCompleteModalFooter: function() {
        return (
            <Modal.Footer>
                <Button onClick={(e)=>this.complete(e)}
                    disabled={!this.state.fetchedVoterCard && this.state.confirmedVote && !this.state.exitButtonEnabled}>
                    {this.state.fetchedVoterCard || !this.state.confirmedVote
                        ? this.getIntlMessage('vote.EXIT')
                        : <Countdown count={VoteWidget.COUNTDOWN}
                            format={(c) => c != 0
                                ? this.getIntlMessage('vote.EXIT_WITHOUT_VOTER_CARD') + ' (' + c + ')'
                                : this.getIntlMessage('vote.EXIT_WITHOUT_VOTER_CARD')}
                            onComplete={()=>this.setState({exitButtonEnabled:true})}/>}
                </Button>
            </Modal.Footer>
        );
    },

    renderVoterCardModalFooter: function() {
        if (!this.state.showVoterCardReader) {
            return null;
        }

        return (
            <Modal.Footer>
                <Button bsStyle="link"
                    onClick={(e)=>this.setState({showVoterCardReader:false})}>
                    Retour
                </Button>
            </Modal.Footer>
        );
    },

    renderModalFooter: function()
    {
        return (
            <div>
                {this.state.step == VoteWidget.STEP_VOTE_CARD
                    ? this.renderVoterCardModalFooter()
                    : <span/>}
                {this.state.step == VoteWidget.STEP_COMPLETE
                    ? this.renderCompleteModalFooter()
                    : <span/>}
            </div>
        );
    },

    render: function()
    {
        var showModalFooter = this.state.step == VoteWidget.STEP_COMPLETE
            || this.state.step == VoteWidget.STEP_VOTE_CARD;

        return (
            <Modal bsSize="large" show={true} dialogClassName="vote-widget">
                <Modal.Header>
                    <Modal.Title>
                        {this.getStepTitle()}
                    </Modal.Title>
                </Modal.Header>
                {this.renderProgressBar()}
                <Modal.Body>
                    {this.state.step == VoteWidget.STEP_VOTER_ID
                        ? this.renderVoterIdDialog()
                        : <span/>}
                    {this.state.step == VoteWidget.STEP_VOTE_CARD
                        ? this.renderVoterCardDialog()
                        : <span/>}
                    {this.state.step == VoteWidget.STEP_CONFIRM
                        ? this.renderConfirmDialog()
                        : <span/>}
                    {this.state.step == VoteWidget.STEP_COMPLETE
                        ? this.renderVoteCompleteDialog()
                        : <span/>}
                </Modal.Body>
                {showModalFooter
                    ? this.renderModalFooter()
                    : <span/>}
            </Modal>
        );
    }
});

module.exports = VoteWidget;
