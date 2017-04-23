var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var classNames = require('classnames');
var dateFormat = require('dateformat');

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
  BallotValueButtonBar = require('./BallotValueButtonBar'),
  BallotValueRadioButtons = require('./BallotValueRadioButtons'),
  BallotValueSelect = require('./BallotValueSelect'),
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
      ballotValue: null,
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
      // ballotValue: this.props.ballotValue,
    });

    var vote = this.state.vote;
    var user = this.state.users.getCurrentUser();
    // if there is a user and it's not authorized to vote
    // or there is no JWT user and the vote is restricted to 3rd party users
    if ((!!user && !!vote && !!vote.permissions && !this.userIsAuthorizedToVote())
        || (!this.state.users.attemptedJWTAuthentication() && vote.restricted)) {
      this.error(VoteWidget.ERROR_UNAUTHORIZED);
    }
  },

  goToBallotStep: function(ballot) {
    if (!ballot) {
      return ;
    }

    // if (!!ballot.error) {
      // FIXME: this.goToStep(VoteWidget.STEP_ERROR)
      // this.error(VoteWidget.ERROR_BALLOT_ERROR);
      // return;
    // }

    if (!!ballot.status) {
      BallotAction.stopPolling();
      this.goToStep(VoteWidget.STEP_COMPLETE);
    }
  },

  voteStoreChanged: function(votes) {
    var vote = votes.getById(this.props.voteId);

    if (vote !== this.state.vote) {
      this.setState({vote: vote});
      this.userStoreChanged();
    }
  },

  ballotStoreChanged: function(ballots) {
    this.checkBallot();
  },

  userStoreChanged: function() {
    var user = this.state.users.getCurrentUser();

    if (user !== this.state.user) {
      this.setState({user: user});
      VoteAction.getPermissions(this.props.voteId);
    }

    if (!!user && this.userIsAuthorizedToVote()) {
      BallotAction.startPolling(this.props.voteId);
    } else {
      BallotAction.stopPolling(this.props.voteId);
    }
  },

  componentWillMount: function() {
    if (this.props.voteId) {
      VoteAction.show(this.props.voteId);
      BallotAction.showCurrentUserBallot(this.props.voteId, true);
      VoteAction.getPermissions(this.props.voteId);
    }
    // FIXME: handle this.props.voteSlug ?

    this.userStoreChanged();
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

  renderBallotValue: function() {
    const vote = this.state.vote;
    const hasProposals = (!!vote.proposals && vote.proposals.length !== 0);
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);
    const values = hasProposals
      ? hasChoices
        ? vote.choices
        : vote.proposals
      : [
        this.getIntlMessage('vote.VOTE_YES'),
        this.getIntlMessage('vote.VOTE_BLANK'),
        this.getIntlMessage('vote.VOTE_NO'),
      ];

    if (hasProposals && hasChoices) {
      return (
        <ul>
          {vote.proposals.map((proposal, k) =>
            <li>
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.PROPOSAL_VALUE')}
                proposal={<Title text={proposal}/>}
                value={<Title text={values[this.state.ballotValue[k]]}/>}/>
            </li>
          )}
        </ul>
      );
    }

    return values[this.state.ballotValue[0]];
  },

  getBallotValueClassNames: function() {
    const vote = this.state.vote;
    const hasProposals = (!!vote.proposals && vote.proposals.length !== 0);
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);

    return {
      'positive': !hasProposals && !hasChoices && this.state.ballotValue[0] === 0,
      'neutral': !hasProposals && !hasChoices && this.state.ballotValue[0] === 1,
      'negative': !hasProposals && !hasChoices && this.state.ballotValue[0] === 2,
    };
  },

  getBallotValueButtonClassNames: function() {
    const vote = this.state.vote;
    const hasProposals = (!!vote.proposals && vote.proposals.length !== 0);
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);

    return {
      'btn-positive': !hasProposals && !hasChoices && this.state.ballotValue === 0,
      'btn-neutral': !hasProposals && !hasChoices && this.state.ballotValue === 1,
      'btn-negative': !hasProposals && !hasChoices && this.state.ballotValue === 2,
      'btn-primary': hasProposals || hasChoices,
      'btn-vote': true,
    };
  },

  renderSVGDownloadButton: function(className) {
    const data = this.state.ballots.getProofOfVoteSVGByVoteId(this.props.voteId);
    const vote = this.state.vote;

    const date = new Date();
    const filename = ('cocorico_' + vote.title
      + '_' + date.toLocaleDateString()
      + '_' + date.toLocaleTimeString()
      + '.svg')
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
        {this.getIntlMessage('vote.DOWNLOAD_PROOF_OF_VOTE')}
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
    const vote = this.state.vote;
    const hasProposals = (!!vote.proposals && vote.proposals.length !== 0);
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);

    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <div className="vote-step-description">
              {!!vote.question
                ? <p>{vote.question}</p>
                : null}
              <div className="vote-step-actions">
              {hasProposals
                ? hasChoices
                  ? <BallotValueSelect vote={vote} onVote={this.voteHandler}/>
                  : <BallotValueRadioButtons vote={vote} onVote={this.voteHandler}/>
                : <BallotValueButtonBar vote={vote} onVote={this.voteHandler}/>}
              </div>
            </div>
          </Col>
        </Row>
      </Grid>
    );
  },

  userIsAuthorizedToVote: function() {
    const vote = this.state.vote;

    return !!vote && !!vote.permissions && vote.permissions.vote;
  },

  renderVoterIdDialog: function() {
    if (!this.state.users.isAuthenticated())
      return this.renderLoginDialog();

    const user = this.state.users.getCurrentUser();

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
                  birthdate={user.birthdate}/> :
              </p>
              <ButtonToolbar className="vote-step-actions">
                <Button bsStyle="primary" onClick={(e)=>this.goToNextStep()}>
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
    const vote = this.state.vote;
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);
    const message = this.getIntlMessage('vote.I_CONFIRM_MY_VOTE')
      + this.getIntlMessage('vote.I_VOTE');
    const value = !hasChoices ? this.renderBallotValue() : null;

    return (
      <Button className={classNames(this.getBallotValueButtonClassNames())}
        disabled={!this.state.confirmVoteButtonEnabled}
        onClick={(e)=>this.confirmVoteValue()}>
          <Countdown count={VoteWidget.COUNTDOWN}
            format={(c) => c === 0
              ? <FormattedHTMLMessage message={message} value={value}/>
              : <FormattedHTMLMessage message={message + ' (' + c + ')'} value={value}/>}
            onComplete={()=>this.setState({confirmVoteButtonEnabled: true})}/>
      </Button>
    );
  },

  renderConfirmDialog: function() {
    const vote = this.state.vote;
    const hasProposals = (!!vote.proposals && vote.proposals.length !== 0);
    const hasChoices = (!!vote.choices && vote.choices.length !== 0);
    const address = this.state.blockchainAccounts.getAddressByVoteId(
      this.props.voteId
    );

    return (
        <Grid>
        <Row className="vote-step-description">
          <Col xs={12}>
            <p>
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.CONFIRM_VOTE_MESSAGE')}
                vote={<Title text={vote.title}/>}/>
            </p>
            {hasProposals && hasChoices
              ? this.renderBallotValue()
              : null}
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
    const proofOfVoteSVG = this.state.ballots.getProofOfVoteSVGByVoteId(
      this.props.voteId
    );
    const ballot = this.state.ballots.getByVoteId(this.props.voteId);

    // If there is a ballot record but the ballotValue state has not
    // been set, it means the ballot has been fetched from the API and the user
    // already voted.
    if (!!ballot && this.state.ballotValue === null && !!this.state.users.getCurrentUser()) {
      return (
        <Grid>
          <Row className="vote-step-description">
            <Col xs={12}>
              <FormattedHTMLMessage
                message={this.getIntlMessage('vote.ALREADY_VOTED')}
                date={dateFormat(ballot.createdAt, 'UTC:dd-mm-yyyy')}
                time={dateFormat(ballot.createdAt, 'UTC:HH:MM:ss Z')}/>
            </Col>
          </Row>
        </Grid>
      );
    }

    return (
      <Grid>
        <Row className="vote-step-description">
          <Col xs={12}>
            <FormattedHTMLMessage
              message={this.getIntlMessage('vote.YOUR_VOTE_IS_COMPLETE')}
              value={
                <strong>
                  <span className={classNames(this.getBallotValueClassNames())}>
                    {this.renderBallotValue()}
                  </span>
                </strong>
              }
              vote={
                <strong>
                  <Title text={this.state.vote.title}/>
                </strong>
              }/>
          </Col>
        </Row>
        {!!proofOfVoteSVG
          ? <Row>
            <Col xs={12}>
              <ButtonToolbar className="vote-step-actions">
                <PrintButton text={this.getIntlMessage('vote.PRINT_PROOF_OF_VOTE')}>
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
    const vote = this.state.vote;

    if (!vote || !vote.createdAt || !vote.permissions) {
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
