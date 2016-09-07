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

var BallotAction = require('../action/BallotAction'),
    BlockchainAccountAction = require('../action/BlockchainAccountAction');

var LoadingIndicator = require('./LoadingIndicator'),
    Hint = require('./Hint'),
    Countdown = require('./Countdown'),
    Title = require('./Title'),
    Page = require('./Page'),
    VoterCard = require('./VoterCard'),
    Icon = require('./Icon'),
    VoterCardDownloadButton = require('./VoterCardDownloadButton'),
    VoterCardPrintButton = require('./VoterCardPrintButton'),
    VoterCardReader = require('./VoterCardReader'),
    VoteButtonBar = require('./VoteButtonBar'),
    LoginPage = require('../page/Login');

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
        STEP_VOTE:          1,
        STEP_VOTE_CARD:     2,
        STEP_CONFIRM:       3,
        STEP_COMPLETE:      4,
        STEP_ERROR:         5,

        COUNTDOWN:          10
    },

    getInitialState: function()
    {
        return {
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
            onComplete: (e) => {},
            modal: true
        };
    },

    componentWillReceiveProps: function(nextProps)
    {
        this.setState({
            visible: nextProps.visible,
            ballotValue: this.props.ballotValue
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

        var completeStatus = [
            'queued', 'pending', 'initialized', 'registered', 'complete'
        ];
        if (completeStatus.indexOf(ballot.status) >= 0) {
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
        // this.listenTo(BallotAction.unvote, (voteId) => {
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
        var ballot = this.state.ballots.getByVoteId(this.props.vote.id);

        if (!!ballot && this.state.ballotStatus != ballot.status)
        {
            this.setState({
                ballotStatus: ballot.status,
                ballotProgressOffset: 0.0
            });
        }

        this.goToBallotStep(ballot);
    },

    voterCardDownloaded: function()
    {
        this.setState({fetchedVoterCard: true});
        if (this.state.step == VoteWidget.STEP_VOTE_CARD) {
            this.goToNextStep();
        }
    },

    voterCardPrinted: function()
    {
        this.setState({fetchedVoterCard: true});
        if (this.state.step == VoteWidget.STEP_VOTE_CARD) {
            this.goToNextStep();
        }
    },

    voteHandler: function(e, proposal)
    {
        this.setState({
            ballotValue: proposal
        });
        this.goToNextStep();
    },

    confirmVoteValue: function()
    {
        var keystore = this.state.blockchainAccounts.getKeystoreByVoteId(
            this.props.vote.id
        );
        var pwDerivedKey = this.state.blockchainAccounts.getPwDerivedKeyByVoteId(
            this.props.vote.id
        );
        var address = this.state.blockchainAccounts.getAddressByVoteId(
            this.props.vote.id
        );

        BallotAction.send(keystore, pwDerivedKey, address, this.props.vote, this.state.ballotValue);
        this.setState({confirmedVote:true});
        // this.goToNextStep();
    },

    createNewVoterCard: function()
    {
        this.setState({blockchainAccountCreated:true});
        BlockchainAccountAction.create(this.props.vote.id);
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
        var voterCard = this.state.blockchainAccounts.getVoterCardByVoteId(
            this.props.vote.id
        );

        return (
            <div className="vote-step-indicator">
                <Grid>
                    <Row>
                        <div className="col-xs-2-4" className="vote-step-progress">
                            <ProgressBar
                                now={this.state.step >= VoteWidget.STEP_VOTER_ID ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}/>
                        </div>
                        <div className="col-xs-2-4" className="vote-step-progress">
                            <ProgressBar
                                now={this.state.step >= VoteWidget.STEP_VOTE ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}/>
                        </div>
                        <div className="col-xs-2-4" className="vote-step-progress">
                            <ProgressBar
                                now={this.state.step >= VoteWidget.STEP_VOTE_CARD ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}
                                active={this.state.step == VoteWidget.STEP_VOTE_CARD && this.state.blockchainAccountCreated && !voterCard}
                                stripped={this.state.step == VoteWidget.STEP_VOTE_CARD && this.state.blockchainAccountCreated && !voterCard}/>
                        </div>
                        <div className="col-xs-2-4" className="vote-step-progress">
                            <ProgressBar
                                now={this.state.step >= VoteWidget.STEP_CONFIRM ? 100 : 0}
                                style={{borderRight:'1px solid white',borderRadius:0}}
                                active={this.state.step == VoteWidget.STEP_CONFIRM && this.state.confirmedVote}
                                stripped={this.state.step == VoteWidget.STEP_CONFIRM && this.state.confirmedVote}/>
                        </div>
                        <div className="col-xs-2-4" className="vote-step-progress">
                            <ProgressBar
                                now={this.state.step >= VoteWidget.STEP_COMPLETE ? 100 : 0}
                                style={{borderRadius:0}}/>
                        </div>
                    </Row>
                    <Row>
                        <div className="col-xs-12 col-sm-2-4">
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_VOTER_ID,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTER_ID,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_VOTER_ID
                                })}>
                                <div className="vote-step-number">
                                    {VoteWidget.STEP_VOTER_ID + 1}
                                </div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_1_NAME')}
                                </span>
                            </div>
                        </div>
                        <div className="col-xs-12 col-sm-2-4">
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_VOTE,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTE,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_VOTE
                                })}>
                                <div className="vote-step-number">
                                    {VoteWidget.STEP_VOTE + 1}
                                </div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_0_NAME')}
                                </span>
                            </div>
                        </div>
                        <div className="col-xs-12 col-sm-2-4">
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_VOTE_CARD,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTE_CARD,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_VOTE_CARD
                                })}>
                                <div className="vote-step-number">
                                    {VoteWidget.STEP_VOTE_CARD + 1}
                                </div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_2_NAME')}
                                </span>
                            </div>
                        </div>
                        <div className="col-xs-12 col-sm-2-4">
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_CONFIRM,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_CONFIRM,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_CONFIRM
                                })}>
                                <div className="vote-step-number">
                                    {VoteWidget.STEP_CONFIRM + 1}
                                </div>
                                <span className="vote-step-name">
                                    {this.getIntlMessage('vote.STEP_3_NAME')}
                                </span>
                            </div>
                        </div>
                        <div className="col-xs-12 col-sm-2-4">
                            <div className={classNames({
                                    'vote-step-counter': true,
                                    'vote-step-counter-active': this.state.step == VoteWidget.STEP_COMPLETE,
                                    'vote-step-counter-done': this.state.step > VoteWidget.STEP_COMPLETE,
                                    'hidden-xs': this.state.step != VoteWidget.STEP_COMPLETE
                                })}>
                                <div className="vote-step-number">
                                    {VoteWidget.STEP_COMPLETE + 1}
                                </div>
                                    <span className="vote-step-name">
                                        {this.getIntlMessage('vote.STEP_4_NAME')}
                                    </span>
                            </div>
                        </div>
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

        return voteDisplay[this.state.ballotValue];
    },

    renderVoterCardPrintButton: function(className)
    {
        if (!this.state.config.capabilities.vote_card.print)
            return null;

        return (
            <VoterCardPrintButton
                className={className ? className : 'btn btn-primary'}
                voteId={this.props.vote.id}
                onClick={this.voterCardPrinted}/>
        );
    },

    renderVoterCardDownloadButton: function(className)
    {
        if (!this.state.config.capabilities.vote_card.download)
            return null;

        // var ballot = this.state.ballots.getByVoteId(this.props.vote.id);
        // var date = new Date(ballot.time);
        var date = new Date();
        var filename = 'cocorico_' + this.props.vote.title
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
                voteId={this.props.vote.id}
                onClick={this.voterCardDownloaded}/>
        );
    },

    renderLoginDialog: function()
    {
        return (
            <div className="vote-step-description">
                <LoginPage />
            </div>
        );
    },

    renderVoteDialog: function()
    {
        return (
            <div className="vote-step-description">
                <div className="vote-step-actions">
                    <VoteButtonBar vote={this.props.vote}
                        onVote={this.voteHandler}/>
                </div>
            </div>
        );
    },

    renderVoterIdDialog: function()
    {
        if (!this.isAuthenticated())
            return this.renderLoginDialog();

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
                    {this.props.modal
                        ? <Button bsStyle="link"
                            disabled={this.state.blockchainAccountCreated}
                            onClick={(e)=>this.props.onCancel(e)}>
                            {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                        </Button>
                        : null}
                </ButtonToolbar>
                <Hint style="warning" pageSlug="attention-usurpation-didentite"/>
            </div>
        );
    },

    renderVoterCardDialog: function()
    {
        var voterCard = this.state.blockchainAccounts.getVoterCardByVoteId(
            this.props.vote.id
        );

        if (this.state.blockchainAccountCreated && !!voterCard) {
            return this.renderDownloadOrPrintVoterCardDialog();
        }

        return (
            <div className="vote-step-description">
                {this.state.showVoterCardReader
                    ? <div>
                        <VoterCardReader voteId={this.props.vote.id}
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
                                {this.props.modal
                                    ? <Button bsStyle="link"
                                        onClick={(e)=>this.props.onCancel(e)}>
                                        {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                                    </Button>
                                    : null}
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
                    'btn-positive': this.state.ballotValue == 0,
                    'btn-neutral': this.state.ballotValue == 1,
                    'btn-negative': this.state.ballotValue == 2,
                    'btn-vote': true
                })}
                disabled={!this.state.confirmVoteButtonEnabled}
                onClick={(e)=>this.confirmVoteValue()}>
                    <Countdown count={VoteWidget.COUNTDOWN}
                        format={(c) => c == 0
                            ? <FormattedMessage
                                message={this.getIntlMessage('vote.I_CONFIRM_MY_VOTE')
                                    + this.getIntlMessage('vote.I_VOTE')}
                                value={this.getVoteValueDisplayMessage()}/>
                            : <FormattedMessage
                                message={this.getIntlMessage('vote.I_CONFIRM_MY_VOTE')
                                    + this.getIntlMessage('vote.I_VOTE') + ' ('
                                    + c + ')'}
                                value={this.getVoteValueDisplayMessage()}/>}
                        onComplete={()=>this.setState({confirmVoteButtonEnabled : true})}/>
            </Button>
        );
    },

    renderConfirmDialog: function()
    {
        return (
            <div className="vote-step-description">
                <p>
                    <FormattedMessage
                        message={this.getIntlMessage('vote.CONFIRM_VOTE_MESSAGE')}
                        value={
                            <strong>
                                <span className={classNames({
                                        'positive': this.state.ballotValue == 0,
                                        'neutral': this.state.ballotValue == 1,
                                        'negative': this.state.ballotValue == 2
                                    })}>
                                {this.getVoteValueDisplayMessage()}
                                </span>
                            </strong>
                        }
                        vote={
                            <strong>
                                <Title text={this.props.vote.title}/>
                            </strong>
                        }/>
                </p>
                <ButtonToolbar className="vote-step-actions">
                    {this.state.confirmedVote
                        ? <LoadingIndicator text="Envoi de votre vote en cours..."/>
                        : <div>
                            {this.renderConfirmVoteButton()}
                            {this.props.modal
                                ? <Button bsStyle="link"
                                    onClick={(e)=>this.props.onCancel(e)}>
                                    {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
                                </Button>
                                : null}
                        </div>}
                </ButtonToolbar>
                {this.state.skipVoterCardButtonEnabled && !this.state.fetchedVoterCard
                    ? <Hint style="warning"
                        pageSlug="attention-recuperer-carte-de-vote-2">
                        <ButtonToolbar>
                            {this.renderVoterCardPrintButton('btn btn-warning')}
                            {this.renderVoterCardDownloadButton('btn btn-warning')}
                        </ButtonToolbar>
                    </Hint>
                    : null}
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
                                            'positive': this.state.ballotValue == 0,
                                            'neutral': this.state.ballotValue == 1,
                                            'negative': this.state.ballotValue == 2
                                        })}>
                                        {this.getVoteValueDisplayMessage()}
                                    </span>
                                </strong>
                            }
                            vote={
                                <strong>
                                    <Title text={this.props.vote.title}/>
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

    renderCompleteModalFooter: function() {
        return (
            <Button
                onClick={(e)=>this.complete(e)}
                disabled={!this.state.fetchedVoterCard && this.state.confirmedVote && !this.state.exitButtonEnabled}>
                {this.state.fetchedVoterCard || !this.state.confirmedVote
                    ? this.getIntlMessage('vote.EXIT')
                    : <Countdown
                        count={VoteWidget.COUNTDOWN}
                        format={(c) => c != 0
                            ? this.getIntlMessage('vote.EXIT_WITHOUT_VOTER_CARD') + ' (' + c + ')'
                            : this.getIntlMessage('vote.EXIT_WITHOUT_VOTER_CARD')}
                        onComplete={()=>this.setState({exitButtonEnabled:true})}/>}
            </Button>
        );
    },

    renderVoterCardModalFooter: function() {
        if (!this.state.showVoterCardReader) {
            return null;
        }

        return (
            <Button
                bsStyle="link"
                onClick={(e)=>this.setState({showVoterCardReader:false})}>
                Retour
            </Button>
        );
    },

    renderVoterIdModalFooter: function()
    {
        return (
            <Button
                bsStyle="link"
                onClick={(e)=>this.props.onCancel(e)}>
                {this.getIntlMessage('vote.CANCEL_MY_VOTE')}>
                Annuler
            </Button>
        );
    },

    renderModalFooter: function()
    {
        if (!this.props.modal) {
            return null;
        }

        return (
            <div>
                {this.state.step == VoteWidget.STEP_VOTER_ID
                    ? this.renderVoterIdModalFooter()
                    : null}
                {this.state.step == VoteWidget.STEP_VOTE_CARD
                    ? this.renderVoterCardModalFooter()
                    : null}
                {this.state.step == VoteWidget.STEP_COMPLETE
                    ? this.renderCompleteModalFooter()
                    : null}
            </div>
        );
    },

    renderModal: function()
    {
        var showModalFooter = this.state.step == VoteWidget.STEP_COMPLETE
            || this.state.step == VoteWidget.STEP_VOTE_CARD;

        return (
            <Modal bsSize="large" show={true} dialogClassName="vote-widget">
                <Modal.Header>
                    <h1 className="vote-title">
                        <Icon name="enveloppe"/>
                        <Title text={this.props.vote.title}/>
                    </h1>
                </Modal.Header>
                {this.renderProgressBar()}
                <Modal.Body>
                    {this.state.step == VoteWidget.STEP_VOTE
                        ? this.renderVoteDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_VOTER_ID
                        ? this.renderVoterIdDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_VOTE_CARD
                        ? this.renderVoterCardDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_CONFIRM
                        ? this.renderConfirmDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_COMPLETE
                        ? this.renderVoteCompleteDialog()
                        : null}
                </Modal.Body>
                {showModalFooter
                    ? <Modal.Footer>
                        {this.renderModalFooter()}
                    </Modal.Footer>
                    : <span/>}
            </Modal>
        );
    },

    render: function()
    {
        if (this.props.modal)
            return this.renderModal();

        var showFooter = this.state.step == VoteWidget.STEP_COMPLETE
            || this.state.step == VoteWidget.STEP_VOTE_CARD;

        return (
            <div className="vote-widget">
                <h1 className="vote-title">
                    <Icon name="enveloppe"/>
                    <Title text={this.props.vote.title}/>
                </h1>
                <div>
                    {this.renderProgressBar()}
                </div>
                <div>
                    {this.state.step == VoteWidget.STEP_VOTE
                        ? this.renderVoteDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_VOTER_ID
                        ? this.renderVoterIdDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_VOTE_CARD
                        ? this.renderVoterCardDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_CONFIRM
                        ? this.renderConfirmDialog()
                        : null}
                    {this.state.step == VoteWidget.STEP_COMPLETE
                        ? this.renderVoteCompleteDialog()
                        : null}
                </div>
                {showFooter
                    ? this.renderModalFooter()
                    : null}
            </div>
        );
    }
});

module.exports = VoteWidget;
