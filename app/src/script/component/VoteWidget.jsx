var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var classNames = require('classnames');

var Button = ReactBootstrap.Button,
  ButtonToolbar = ReactBootstrap.ButtonToolbar,
  Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col,
  ProgressBar = ReactBootstrap.ProgressBar;

var FormattedMessage = ReactIntl.FormattedMessage,
  FormattedHTMLMessage = ReactIntl.FormattedHTMLMessage;

var BallotAction = require('../action/BallotAction'),
  VoteAction = require('../action/VoteAction'),
  BlockchainAccountAction = require('../action/BlockchainAccountAction');

var LoadingIndicator = require('./LoadingIndicator'),
  Hint = require('./Hint'),
  Countdown = require('./Countdown'),
  Title = require('./Title'),
  Icon = require('./Icon'),
  SVGDownloadButton = require('./SVGDownloadButton'),
  VoteButtonBar = require('./VoteButtonBar'),
  VoteRadioButtons = require('./VoteRadioButtons'),
  LoginPage = require('../page/Login'),
  SVGImage = require('./SVGImage'),
  PrintButton = require('./PrintButton');

var ConfigStore = require('../store/ConfigStore'),
  BallotStore = require('../store/BallotStore'),
  UserStore = require('../store/UserStore'),
  VoteStore = require('../store/VoteStore'),
  BlockchainAccountStore = require('../store/BlockchainAccountStore');

var ForceAuthMixin = require('../mixin/ForceAuthMixin'),
  ForceBrowserCompatibility = require('../mixin/ForceBrowserCompatibility');

var VoteWidget = React.createClass({

  mixins: [
    ForceAuthMixin,
    Reflux.connect(ConfigStore, 'config'),
    Reflux.connect(UserStore, 'users'),
    Reflux.connect(BallotStore, 'ballots'),
    Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
    Reflux.listenTo(VoteStore, 'voteStoreChanged'),
    Reflux.listenTo(BallotStore, 'ballotStoreChanged'),
    Reflux.listenTo(UserStore, 'userStoreChanged'),
    ReactIntl.IntlMixin,
    ForceBrowserCompatibility,
  ],

  statics: {
    STEP_VOTER_ID:      0,
    STEP_VOTE:          1,
    STEP_CONFIRM:       2,
    STEP_COMPLETE:      3,
    STEP_ERROR:         4,

    ERROR_NONE:         0,
    ERROR_UNAUTHORIZED: 1,
    ERROR_BALLOT_ERROR: 2,

    COUNTDOWN:          10,
  },

  getInitialState: function() {
    return {
      vote: null,
      step: 0,
      blockchainAccountCreated: false,
      confirmVoteButtonEnabled: false,
      skipVoterCardButtonEnabled: false,
      fetchedVoterCard: false,
      error: VoteWidget.ERROR_NONE,
    };
  },

  getDefaultProps: function() {
    return {
      onCancel: (v) => {},
      onComplete: (v) => {},
      onError: (v) => {},
      onSuccess: (v) => {},
    };
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      visible: nextProps.visible,
      ballotValue: this.props.ballotValue,
    });

    var vote = this.state.vote;
    var user = this.state.users.getCurrentUser();
    // if there is a user and it's not authorized to vote
    // or there is no JWT user and the vote is restricted to 3rd party users
    if ((!!user && !this.userIsAuthorizedToVote())
        || (!this.state.users.attemptedJWTAuthentication() && vote.restricted)) {
      this.error(VoteWidget.ERROR_UNAUTHORIZED);
    }
  },

  goToBallotStep: function(ballot) {
    if (!ballot) {
      return ;
    }

    if (!!ballot.error) {
            // FIXME: this.goToStep(VoteWidget.STEP_ERROR)
            // this.error(VoteWidget.ERROR_BALLOT_ERROR);
      return;
    }

    var completeStatus = [
      'queued', 'pending', 'initialized', 'registered', 'complete',
    ];
    if (completeStatus.indexOf(ballot.status) >= 0) {
      BallotAction.stopPolling();
      this.goToStep(VoteWidget.STEP_COMPLETE);
    } else {
      BallotAction.startPolling(this.props.voteId);
    }
  },

  voteStoreChanged: function(votes) {
    var vote = votes.getById(this.props.voteId);

    if (!!vote) {
      this.setState({vote: vote});
    }
  },

  ballotStoreChanged: function(ballots) {
    this.checkBallot();
  },

  userStoreChanged: function(users) {
    var user = this.state.users.getCurrentUser();
    if (!!user) {
      VoteAction.getPermissions(this.props.voteId);
    }
  },

  componentWillMount: function() {
    if (this.props.voteId) {
      VoteAction.show(this.props.voteId);
      BallotAction.showCurrentUserBallot(this.props.voteId, true);
      VoteAction.getPermissions(this.props.voteId);
    }
    // FIXME: handle this.props.voteSlug ?

    this.checkBallot();
  },

  componentDidMount: function() {
    // this.listenTo(BallotAction.unvote, (voteId) => {
    //     this.goToStep(VoteWidget.STEP_CONFIRM);
    // });
    BallotAction.stopPolling();
  },

  componentWillUnmount: function() {
    this.goToStep(0);

    window.onbeforeunload = null;

    delete this._completeTimeout;
  },

  checkBallot: function() {
    var ballot = this.state.ballots.getByVoteId(this.props.voteId);

    if (!!ballot && this.state.ballotStatus !== ballot.status) {
      this.setState({
        ballotStatus: ballot.status,
        ballotProgressOffset: 0.0,
      });
    }

    this.goToBallotStep(ballot);
  },

  error: function(err) {
    var vote = this.state.vote;

    this.setState({error:err});
    this.props.onError(vote);
  },

  voteHandler: function(e, proposal) {
    this.setState({
      ballotValue: proposal,
    });
    this.goToNextStep();
  },

  confirmVoteValue: function() {
    var keystore = this.state.blockchainAccounts.getKeystoreByVoteId(
      this.props.voteId
    );
    var pwDerivedKey = this.state.blockchainAccounts.getPwDerivedKeyByVoteId(
      this.props.voteId
    );
    var address = this.state.blockchainAccounts.getAddressByVoteId(
      this.props.voteId
    );

    var vote = this.state.vote;

    BallotAction.send(keystore, pwDerivedKey, address, vote, this.state.ballotValue);
    this.setState({confirmedVote:true});
    // this.goToNextStep();
  },

  createNewVoterCard: function() {
    this.setState({blockchainAccountCreated:true});
    BlockchainAccountAction.create(this.props.voteId);
  },

  goToStep: function(step) {
    if (step !== this.state.step) {
      this.setState({step: step});

      switch (step) {
        case 0:
        case VoteWidget.STEP_VOTER_ID:
          this.setState(this.getInitialState());
          break;
        case VoteWidget.STEP_CONFIRM:
          this.createNewVoterCard();
          break;
        case VoteWidget.STEP_COMPLETE:
          this.props.onSuccess(this.getSafeContext());
          break;
        default:
      }
    }
  },

  goToPreviousStep: function() {
    this.goToStep(this.state.step - 1);
  },

  goToNextStep: function() {
    this.goToStep(this.state.step + 1);
  },

  renderProgressBar: function() {
    return (
      <div className="vote-step-indicator">
        <Grid>
          <Row>
            <div className="col-md-3" className="vote-step-progress">
              <ProgressBar
                now={this.state.step >= VoteWidget.STEP_VOTER_ID ? 100 : 0}
                style={{borderRight:'1px solid white',borderRadius:0}}/>
            </div>
            <div className="col-md-3" className="vote-step-progress">
              <ProgressBar
                now={this.state.step >= VoteWidget.STEP_VOTE ? 100 : 0}
                style={{borderRight:'1px solid white',borderRadius:0}}/>
            </div>
            <div className="col-md-3" className="vote-step-progress">
              <ProgressBar
                now={this.state.step >= VoteWidget.STEP_CONFIRM ? 100 : 0}
                style={{borderRight:'1px solid white',borderRadius:0}}
                active={this.state.step === VoteWidget.STEP_CONFIRM && this.state.confirmedVote}
                stripped={this.state.step === VoteWidget.STEP_CONFIRM && this.state.confirmedVote}/>
            </div>
            <div className="col-md-3" className="vote-step-progress">
              <ProgressBar
                now={this.state.step >= VoteWidget.STEP_COMPLETE ? 100 : 0}
                style={{borderRadius:0}}/>
            </div>
          </Row>
          <Row>
            <div className="col-xs-12 col-sm-3">
              <div className={classNames({
                'vote-step-counter': true,
                'vote-step-counter-active': this.state.step === VoteWidget.STEP_VOTER_ID,
                'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTER_ID,
                'hidden-xs': this.state.step !== VoteWidget.STEP_VOTER_ID,
              })}>
                <div className="vote-step-number">
                  {VoteWidget.STEP_VOTER_ID + 1}
                </div>
                <span className="vote-step-name">
                  {this.getIntlMessage('vote.STEP_0_NAME')}
                </span>
              </div>
            </div>
            <div className="col-xs-12 col-sm-3">
              <div className={classNames({
                'vote-step-counter': true,
                'vote-step-counter-active': this.state.step === VoteWidget.STEP_VOTE,
                'vote-step-counter-done': this.state.step > VoteWidget.STEP_VOTE,
                'hidden-xs': this.state.step !== VoteWidget.STEP_VOTE,
              })}>
                <div className="vote-step-number">
                  {VoteWidget.STEP_VOTE + 1}
                </div>
                <span className="vote-step-name">
                  {this.getIntlMessage('vote.STEP_1_NAME')}
                </span>
              </div>
            </div>
            <div className="col-xs-12 col-sm-3">
              <div className={classNames({
                'vote-step-counter': true,
                'vote-step-counter-active': this.state.step === VoteWidget.STEP_CONFIRM,
                'vote-step-counter-done': this.state.step > VoteWidget.STEP_CONFIRM,
                'hidden-xs': this.state.step !== VoteWidget.STEP_CONFIRM,
              })}>
                <div className="vote-step-number">
                  {VoteWidget.STEP_CONFIRM + 1}
                </div>
                <span className="vote-step-name">
                  {this.getIntlMessage('vote.STEP_3_NAME')}
                </span>
              </div>
            </div>
            <div className="col-xs-12 col-sm-3">
              <div className={classNames({
                'vote-step-counter': true,
                'vote-step-counter-active': this.state.step === VoteWidget.STEP_COMPLETE,
                'vote-step-counter-done': this.state.step > VoteWidget.STEP_COMPLETE,
                'hidden-xs': this.state.step !== VoteWidget.STEP_COMPLETE,
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

  getVoteValueDisplayMessage: function() {
    var vote = this.state.vote;

    var labels = (!!vote.labels && vote.labels.length !== 0)
      ? vote.labels
      : [
        this.getIntlMessage('vote.VOTE_YES'),
        this.getIntlMessage('vote.VOTE_BLANK'),
        this.getIntlMessage('vote.VOTE_NO'),
      ];

    return labels[this.state.ballotValue];
  },

  getVoteValueMessageClassNames: function() {
    var vote = this.state.vote;
    var hasLabels = (!!vote.labels && vote.labels.length !== 0);

    return {
      'positive': !hasLabels && this.state.ballotValue === 0,
      'neutral': !hasLabels || this.state.ballotValue === 1,
      'negative': !hasLabels && this.state.ballotValue === 2,
    };
  },

  getVoteValueButtonClassNames: function() {
    var vote = this.state.vote;
    var hasLabels = (!!vote.labels && vote.labels.length !== 0);

    return {
      'btn-positive': !hasLabels && this.state.ballotValue === 0,
      'btn-neutral': !hasLabels && this.state.ballotValue === 1,
      'btn-negative': !hasLabels && this.state.ballotValue === 2,
      'btn-primary': hasLabels,
      'btn-vote': true,
    };
  },

  renderSVGDownloadButton: function(className) {
    var data = this.state.ballots.getProofOfVoteSVGByVoteId(this.props.voteId);
    var vote = this.state.vote;

    // var ballot = this.state.ballots.getByVoteId(this.props.voteId);
    // var date = new Date(ballot.time);
    var date = new Date();
    var filename = 'cocorico_' + vote.title
      + '_' + date.toLocaleDateString()
      + '_' + date.toLocaleTimeString()
      + '.svg';

    filename = filename
      .toLowerCase()
      .replace(/ /g, '_')
      .replace(/[:\/]/g, '');

    return (
      <SVGDownloadButton
          data={data}
          filename={filename}
          className={className ? className : 'btn btn-primary'}
          voteId={this.props.voteId}
          onClick={this.voterCardDownloaded}>
        Download my proof of vote
      </SVGDownloadButton>
    );
  },

  renderLoginDialog: function() {
    return (
      <div className="vote-step-description">
        <LoginPage />
      </div>
    );
  },

  renderVoteDialog: function() {
    var vote = this.state.vote;

    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <div className="vote-step-description">
              {!!vote.question
                ? <p>{vote.question}</p>
                : null}
              <div className="vote-step-actions">
              {!!vote.labels && vote.labels.length !== 0
                ? <VoteRadioButtons vote={vote} onVote={this.voteHandler}/>
                : <VoteButtonBar vote={vote} onVote={this.voteHandler}/>}
              </div>
            </div>
          </Col>
        </Row>
      </Grid>
    );
  },

  userIsAuthorizedToVote: function() {
    var vote = this.state.vote;

    return !vote.permissions || vote.permissions.vote;
  },

  renderVoterIdDialog: function() {
    if (!this.state.users.isAuthenticated())
      return this.renderLoginDialog();

    var user = this.state.users.getCurrentUser();
    var birthdate = new Date(user.birthdate);

    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <div className="vote-step-description">
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.STEP_0_DESCRIPTION')}/>
              <p>
                <FormattedHTMLMessage
                  message={this.getIntlMessage('vote.ANNOUNCE_VOTER_ID')}
                  name={user.firstName + ' ' + user.lastName}
                  birthdate={birthdate.toLocaleDateString()}/> :
              </p>
              <ButtonToolbar className="vote-step-actions">
                <Button bsStyle="primary" onClick={(e)=>this.goToNextStep()}
                  id="btn-vote-confirm-id">
                  <FormattedMessage
                    message={this.getIntlMessage('vote.CONFIRM_VOTER_ID')}
                    name={user.firstName + ' ' + user.lastName}/>
                </Button>
                <a className="btn btn-default" onClick={(e) => this.props.onCancel(this.getSafeContext())}>
                  <FormattedMessage
                    message={this.getIntlMessage('vote.DENY_VOTER_ID')}/>
                </a>
              </ButtonToolbar>
              <Hint style="warning">
                <FormattedHTMLMessage
                  message={this.getIntlMessage('vote.STEP_0_WARNING')}/>
              </Hint>
            </div>
          </Col>
        </Row>
      </Grid>
    );
  },

  renderConfirmVoteButton: function() {
    return (
      <Button className={classNames(this.getVoteValueButtonClassNames())}
        id="btn-vote-confirm-ballot"
        disabled={!this.state.confirmVoteButtonEnabled}
        onClick={(e)=>this.confirmVoteValue()}>
          <Countdown count={VoteWidget.COUNTDOWN}
            format={(c) => c === 0
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

  renderConfirmDialog: function() {
    var vote = this.state.vote;
    var address = this.state.blockchainAccounts.getAddressByVoteId(
      this.props.voteId
    );

    return (
        <Grid>
        <Row className="vote-step-description">
          <Col xs={12}>
            <p>
              <FormattedMessage
                message={this.getIntlMessage('vote.CONFIRM_VOTE_MESSAGE')}
                value={
                  <strong>
                    <span className={this.getVoteValueMessageClassNames()}>
                    {this.getVoteValueDisplayMessage()}
                    </span>
                  </strong>
                }
                vote={
                  <strong>
                    <Title text={vote.title}/>
                  </strong>
                }/>
            </p>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ButtonToolbar className="vote-step-actions">
              {!address
                ? <LoadingIndicator/>
                : this.state.confirmedVote
                  ? <LoadingIndicator
                      text={this.getIntlMessage('vote.PENDING_BALLOT_TRANSACTION')}/>
                  : <div>
                    {this.renderConfirmVoteButton()}
                  </div>}
            </ButtonToolbar>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Hint style="warning">
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.STEP_3_WARNING')}/>
            </Hint>
          </Col>
        </Row>
      </Grid>
    );
  },

  renderVoteCompleteDialog: function() {
    var proofOfVoteSVG = this.state.ballots.getProofOfVoteSVGByVoteId(
      this.props.voteId
    );

    return (
      <Grid>
        <Row className="vote-step-description">
          <Col xs={12}>
            <p>
              <FormattedMessage
                message={this.getIntlMessage('vote.YOUR_VOTE_IS_COMPLETE')}
                value={
                  <strong>
                    <span className={classNames(this.getVoteValueMessageClassNames())}>
                      {this.getVoteValueDisplayMessage()}
                    </span>
                  </strong>
                }
                vote={
                  <strong>
                    <Title text={this.state.vote.title}/>
                  </strong>
                }/>
            </p>
          </Col>
        </Row>
        {!!proofOfVoteSVG
          ? <Row>
            <Col xs={12}>
              <ButtonToolbar className="vote-step-actions">
                <PrintButton text="Print my proof of vote">
                  <SVGImage data={proofOfVoteSVG}/>
                </PrintButton>
                {this.renderSVGDownloadButton()}
              </ButtonToolbar>
            </Col>
          </Row>
          : null}
        <Row>
          <Col xs={12}>
            <Hint>
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.STEP_4_HINT')}/>
            </Hint>
          </Col>
        </Row>
      </Grid>
    );
  },

  complete: function(e) {
    window.onbeforeunload = null;
    // this.goToStep(VoteWidget.STEP_INIT);
    this.props.onComplete(e);
  },

  renderContent: function() {
    return (
      <div>
        {this.state.step === VoteWidget.STEP_VOTE
            ? this.renderVoteDialog()
            : null}
        {this.state.step === VoteWidget.STEP_VOTER_ID
            ? this.renderVoterIdDialog()
            : null}
        {this.state.step === VoteWidget.STEP_VOTE_CARD
            ? this.renderVoterCardDialog()
            : null}
        {this.state.step === VoteWidget.STEP_CONFIRM
            ? this.renderConfirmDialog()
            : null}
        {this.state.step === VoteWidget.STEP_COMPLETE
            ? this.renderVoteCompleteDialog()
            : null}
      </div>
    );
  },

  renderAuthorizationError: function() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Hint style="danger">
              <h3>Ohoo... :(</h3>
              <p>Vous n'êtes pas autorisé à participer à ce vote.</p>
            </Hint>
          </Col>
        </Row>
      </Grid>
    );
  },

  getSafeContext: function() {
    // Return a mapping containing only values that are safe to pass to
    // parent window when posting event messages.
    return {
      vote: this.state.vote,
      step: this.state.step,
      userAuthenticated: this.state.isAuthenticated,
      error: this.state.error,
    };
  },

  renderExitButton: function() {
    // Render top-right button that allows the user to either cancel his
    // vote or terminate the voting workflow once his vote has successfully
    // been register.
    return (!!this.state.step && this.state.step === VoteWidget.STEP_COMPLETE)
      ? <Button bsStyle="success"
          onClick={(e) => this.props.onComplete(this.getSafeContext())}>
          {this.getIntlMessage('vote.EXIT')}
      </Button>
      : <Button bsStyle="outline"
          disabled={!!this.state.confirmedVote}
          onClick={(e) => this.props.onCancel(this.getSafeContext())}>
          {this.getIntlMessage('vote.CANCEL_MY_VOTE')}
      </Button>
  },

  render: function() {
    var vote = this.state.vote;

    if (!vote || !vote.title || !vote.permissions) {
      return (
        <div className="text-center" style={{paddingTop:'200px'}}>
            <LoadingIndicator/>
        </div>
      );
    }

    return (
      <div className={classNames({
        'vote-widget': true,
        'vote-widget-error': this.state.error !== VoteWidget.ERROR_NONE,
      })}>
        <h1 className="vote-title">
          <Icon name="enveloppe"/>
          <Title text={vote.title}/>
        </h1>
        <div className="vote-exit">
          {this.renderExitButton()}
        </div>
        <div>
          {this.renderProgressBar()}
        </div>
        <div className="vote-step">
          {this.state.error !== VoteWidget.ERROR_NONE
            ? this.renderAuthorizationError()
            : this.renderContent()}
        </div>
      </div>
    );
  },
});

module.exports = VoteWidget;
