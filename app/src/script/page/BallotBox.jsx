var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var classNames = require('classnames');
var Base64 = require('js-base64').Base64;
var jwtDecode = require('jwt-decode');
var DoughnutChart = require('react-chartjs-2').Doughnut;
var dateFormat = require('dateformat');

var StringHelper = require('../helper/StringHelper');

var TransactionStore = require('../store/TransactionStore'),
  VoteStore = require('../store/VoteStore'),
  ProofOfVoteStore = require('../store/ProofOfVoteStore');

var BallotAction = require('../action/BallotAction'),
  VoteAction = require('../action/VoteAction'),
  ProofOfVoteAction = require('../action/ProofOfVoteAction');

var LoadingIndicator = require('../component/LoadingIndicator'),
  Title = require('../component/Title'),
  Icon = require('../component/Icon'),
  QRCodeReader = require('../component/QRCodeReader'),
  FileSelectButton = require('../component/FileSelectButton'),
  Hint = require('../component/Hint');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col,
  Modal = ReactBootstrap.Modal,
  Button = ReactBootstrap.Button,
  ButtonToolbar = ReactBootstrap.ButtonToolbar,
  FormGroup = ReactBootstrap.FormGroup,
  MenuItem = ReactBootstrap.MenuItem,
  InputGroup = ReactBootstrap.InputGroup,
  FormControl = ReactBootstrap.FormControl,
  DropdownButton = ReactBootstrap.DropdownButton,
  Pagination = ReactBootstrap.Pagination;

var BallotBox = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(TransactionStore, 'transactions'),
    Reflux.connect(VoteStore, 'votes'),
    Reflux.connect(ProofOfVoteStore, 'proofsOfVote'),
    Reflux.listenTo(TransactionStore, 'transactionStoreChangedHandler'),
    Reflux.listenTo(ProofOfVoteStore, 'proofOfVoteStoreChangedHandler'),
  ],

  getInitialState: function() {
    return {
      page: 0,
      proofOfVote: '',
      qrCodeReader: false,
      searchQuery: '',
      searchMode: 'voter',
      searching: false,
    };
  },

  componentWillMount: function() {
    BallotAction.getTransactions(this.props.params.voteId, this.state.page);
    VoteAction.show(this.props.params.voteId);
    VoteAction.showResults(this.props.params.voteId);
  },

  getVoteValueDisplayMessage: function(id) {
    var vote = this.state.votes.getById(this.props.params.voteId);
    var labels = (!!vote.labels && vote.labels.length !== 0)
      ? vote.labels
      : [
        this.getIntlMessage('vote.VOTE_YES'),
        this.getIntlMessage('vote.VOTE_BLANK'),
        this.getIntlMessage('vote.VOTE_NO'),
      ];

    return labels[id];
  },

  readFromQRCodeHandler: function(data) {
    this.verifyProofOfVote(data);
  },

  readFromFileHandler: function(data) {
    var svg = Base64.decode(data.substr(26));
    var pof = svg.match(/<desc>(.*)<\/desc>/);

    var data = pof[1];

    this.verifyProofOfVote(data);
  },

  verifyProofOfVote(proofOfVote) {
    if (!!proofOfVote) {
      var decoded = jwtDecode(proofOfVote);

      ProofOfVoteAction.verify(proofOfVote);

      this.setState(
        {
          page: 0,
          proofOfVote: proofOfVote,
          searchMode: 'voter',
          searchQuery: '0x' + decoded.a,
        },
        this.search
      );
    }
  },

  proposalLabelToID: function(label) {
    var vote = this.state.votes.getById(this.props.params.voteId);
    var labels = (!!vote.labels && vote.labels.length !== 0)
      ? vote.labels.map((l)=>l.toLowerCase())
      : [
        this.getIntlMessage('vote.VOTE_YES').toLowerCase(),
        this.getIntlMessage('vote.VOTE_BLANK').toLowerCase(),
        this.getIntlMessage('vote.VOTE_NO').toLowerCase(),
      ];

    return labels.indexOf(label.toLowerCase());
  },

  transactionStoreChangedHandler: function() {
    this.setState({searching:false});
  },

  proofOfVoteStoreChangedHandler: function() {
    VoteAction.show(this.props.params.voteId, true);
  },

  search: function() {
    if (!!this._searchTimeout) {
      clearTimeout(this._searchTimeout);
    }

    var query = this.state.searchQuery;

    // If we're looking for transactions for a specific proposal, the user
    // will type a string but the server expects the proposal ID.
    if (this.state.searchMode === 'proposal') {
      query = this.proposalLabelToID(query);
      if (query < 0) {
        query = '';
      }
    }

    this._searchTimeout = setTimeout(
      () => BallotAction.searchTransactions(
        this.props.params.voteId,
        this.state.page,
        {[this.state.searchMode] : query}
      ),
      1000
    );

    this.setState({searching: true});
  },

  componentWillUnmount: function() {
    if (!!this._searchTimeout) {
      clearTimeout(this._searchTimeout);
    }
  },

  resetProofOfVote: function() {
    this.setState(
      {
        proofOfVote: '',
        searchQuery: '',
      },
      this.search
    );
  },

  renderVoteVerifySuccessChart: function(vote) {
    var labels = ['Valid', 'Invalid'];
    var backgroundColor = ['#2ecc71', '#e74c3c'];
    var hoverBackgroundColor = ['#27ae60', '#c0392b'];
    var data = [vote.numValidBallots, vote.numInvalidBallots];
    var hasData = vote.numValidBallots !== 0 || vote.numInvalidBallots !== 0;

    if (!hasData) {
      labels = ['Not enough data yet.'];
      data = [1];
      backgroundColor = ['#bdc3c7'];
      hoverBackgroundColor = ['#95a5a6'];
    }

    return (
      <DoughnutChart data={{
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColor,
            hoverBackgroundColor: hoverBackgroundColor,
          }],
      }}
      options={{
        cutoutPercentage: 80,
        responsive: true,
        legend: {
          display: false,
        },
        tooltips: {
          enabled: hasData,
        },
      }}
      width={90}
      height={90}/>
    );
  },

  renderVoteResultChart: function(vote) {
    var data = this.state.votes.getVoteResultByVoteId(this.props.params.voteId);

    if (!data) {
      return null;
    }

    var labels = !!vote.labels.length
      ? vote.labels
      : [
        this.getIntlMessage('vote.VOTE_YES').toLowerCase(),
        this.getIntlMessage('vote.VOTE_BLANK').toLowerCase(),
        this.getIntlMessage('vote.VOTE_NO').toLowerCase(),
      ];
    var colors = !!vote.labels.length
      ? [
        '#001F3F',
        '#0074D9',
        '#7FDBFF',
        '#39CCCC',
        '#3D9970',
        '#2ECC40',
        '#01FF70',
        '#FFDC00',
        '#FF851B',
        '#FF4136',
        '#F012BE',
        '#B10DC9',
        '#85144B',
        '#FFFFFF',
        '#AAAAAA',
        '#DDDDDD',
        '#111111',
      ]
      : [
        '#2ecc71',
        '#e74c3c',
        '#bdc3c7',
      ];

    var hoverColors = !!vote.labels.length
      ? colors
      : [
        '#27ae60',
        '#c0392b',
        '#95a5a6',
      ];

    return (
      <DoughnutChart data={{
        labels: labels.map((label)=>StringHelper.toTitleCase(label)),
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            hoverBackgroundColor: hoverColors,
          }],
      }}
      options={{
        cutoutPercentage: 80,
        responsive: true,
      }}
      width={90}
      height={90}/>
    );
  },

  renderVoteVerifyChart: function(vote) {
    if (vote.numVerifiedBallots === 0) {
      return null;
    }

    return (
      <DoughnutChart data={{
        labels: [
          'Valid',
          'Invalid',
          'Unverified',
        ],
        datasets: [
          {
            data: [
              vote.numValidBallots,
              vote.numInvalidBallots,
              vote.numBallots - (vote.numValidBallots + vote.numInvalidBallots),
            ],
            backgroundColor: [
              '#2ecc71',
              '#e74c3c',
              '#bdc3c7',
            ],
            hoverBackgroundColor: [
              '#27ae60',
              '#c0392b',
              '#95a5a6',
            ],
          }],
      }}
      options={{
        cutoutPercentage: 80,
        responsive: true,
        legend: {
          display: false,
        },
      }}
      width={90}
      height={90}/>
    );
  },

  render: function() {
    return (
      <div className="page page-ballot-box">
        {this.renderContent()}
      </div>
    );
  },

  renderTitle: function(vote) {
    return (
      <Row>
        <Col xs={12}>
          <h1>{vote.title} <small>Ballot Box</small></h1>
        </Col>
      </Row>
    );
  },

  renderContent: function() {
    var vote = this.state.votes.getById(this.props.params.voteId);

    if (!vote) {
      return (
        <Grid>
          <Row>
            <Col xs={12}>
              <LoadingIndicator/>
            </Col>
          </Row>
        </Grid>
      );
    }

    if (vote.status !== 'complete') {
      return (
        <Grid>
          {this.renderTitle(vote)}
          <Row>
            <Col xs={12}>
              <Hint style="danger">
                <h3>This vote is not complete yet...</h3>
                <p>
                  You must wait for a vote to be complete in order to inspect
                  its ballot box.
                </p>
              </Hint>
            </Col>
          </Row>
        </Grid>
      );
    }

    var numVerifiedBallots = vote.numValidBallots + vote.numInvalidBallots;
    var verifying = !!this.state.proofOfVote && (this.state.searching
      || !this.state.proofsOfVote.getVerifiedBallot(this.state.proofOfVote));

    return (
      <div>
        {this.renderQRCodeReaderModal()}
        <Grid>
          {this.renderTitle()}
          <Row className="ballot-box-recount">
            <Col md={4} sm={6} xs={12} className="text-center">
              {this.renderVoteResultChart(vote)}
            </Col>
            <Col md={2} sm={3} smPush={0} xs={6} className="text-center">
              {this.renderVoteVerifySuccessChart(vote)}
              {numVerifiedBallots !== 0
                ? <span>
                  {Math.floor(vote.numValidBallots / numVerifiedBallots * 100.0)}%
                  valid verified ballots
                </span>
                : <span>Not enough data yet.</span>}
            </Col>
            <Col md={2} sm={3} smPush={0} xs={6} className="text-center">
              {this.renderVoteVerifyChart(vote)}
              <span>
                {Math.floor(numVerifiedBallots / vote.numBallots * 100.0)}%
                verified ballots
              </span>
            </Col>
          </Row>
          <Row>
            <Col lg={6} md={12}>
              <h2>Verify your ballot</h2>
              {!this.state.proofOfVote
                ? <ButtonToolbar>
                  <Button
                    bsStyle="primary"
                    onClick={(e)=>this.setState({qrCodeReader:true})}>
                    <Icon name="qrcode"/>Scan my printed proof of vote
                  </Button>
                  <FileSelectButton onSuccess={this.readFromFileHandler}>
                    <Icon name="cloud_upload"/>Select my downloaded proof of vote
                  </FileSelectButton>
                </ButtonToolbar>
                : verifying
                  ? <LoadingIndicator text="Verifying..."/>
                  : <ButtonToolbar>
                    <Button onClick={this.resetProofOfVote}>
                      Verify another proof of vote
                    </Button>
                  </ButtonToolbar>}
            </Col>
            <Col lg={6} md={12}>
              <h2>Explore the ballot box</h2>
              {this.renderSearchForm()}
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              {this.renderTransactionTable()}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  },

  renderQRCodeReaderModal: function() {
    return (
      <Modal show={this.state.qrCodeReader}>
        <Modal.Body>
          <QRCodeReader onSuccess={this.readFromQRCodeHandler}/>
        </Modal.Body>
        <Modal.Footer>
          <Button
            bsStyle="link"
            onClick={(e)=>this.setState({qrCodeReader:false})}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>
    );
  },

  searchQueryChangeHandler: function(e) {
    this.setState({searchQuery: e.target.value}, this.search);
  },

  searchModeChangeHandler: function(k, e) {
    this.setState({searchMode: k}, this.search);
  },

  renderSearchForm: function() {
    var searchModes = {
      'transactionHash': 'Transaction Hash',
      'voter' : 'Voter',
      'proposal' : 'Proposal',
    };

    return (
      <form>
        <FormGroup>
          <InputGroup>
            <FormControl
              type="text"
              placeholder="Type here to search..."
              value={this.state.searchQuery}
              onChange={this.searchQueryChangeHandler}/>
            <DropdownButton
              componentClass={InputGroup.Button}
              id="input-dropdown-addon"
              title={searchModes[this.state.searchMode]}
              onSelect={this.searchModeChangeHandler}
              pullRight={true}>
              {Object.keys(searchModes).map((mode, index) => {
                return (
                  <MenuItem key={index} eventKey={mode}>{searchModes[mode]}</MenuItem>
                );
              })}
            </DropdownButton>
          </InputGroup>
        </FormGroup>
      </form>
    );
  },

  renderTransactionTable: function() {
    var transactions = this.state.transactions.getByVoteId(
      this.props.params.voteId,
      this.state.page
    );
    var vote = this.state.votes.getById(this.props.params.voteId);
    var hasLabels = vote.labels.length !== 0;

    return (
      <div className="ballot-box-content">
        {this.renderPagination()}
        <table className="table table-hover">
          <thead>
            <tr>
              <th style={{width:45}}/>
              <th>Transaction Hash</th>
              <th>Voter</th>
              <th>Proposal</th>
            </tr>
          </thead>
          <tbody>
            {!!transactions && !transactions.error && transactions.length !== 0 && !this.state.searching
              ? transactions.map((tx) => {
                return (
                  <tr key={tx.transactionHash}>
                    <td style={{width:45}} className="text-center">
                      {'verified' in tx
                        ? <span className={tx.verified ? 'positive' : 'negative'}>
                          <Icon name={tx.verified ? 'checkmark' : 'cross'}/>
                        </span>
                        : null}
                    </td>
                    <td className="truncate">{tx.transactionHash}</td>
                    <td className="truncate">{tx.args.voter}</td>
                    <td className="truncate">
                      <span className={classNames({
                        'label': true,
                        'label-primary': hasLabels,
                        'positive-background': !hasLabels && tx.args.proposal === '0',
                        'neutral-background': !hasLabels && tx.args.proposal === '1',
                        'negative-background': !hasLabels && tx.args.proposal === '2',
                      })}>
                        <Title text={this.getVoteValueDisplayMessage(tx.args.proposal)}/>
                      </span>
                    </td>
                  </tr>
                );
              })
              : null}
          </tbody>
        </table>
        {!transactions || !!this.state.searching
          ? <LoadingIndicator/>
          : transactions.length === 0
            ? <p>No ballots.</p>
            : null}
        {this.renderPagination()}
        {this.renderProofOfVoteStatus()}
      </div>
    );
  },

  renderProofOfVoteStatus: function() {
    if (this.state.searching || !this.state.proofOfVote) {
      return null;
    }

    var verified = this.state.proofsOfVote.getVerifiedBallot(
      this.state.proofOfVote
    );

    if (!verified) {
      return null;
    }

    return (
      <div className={classNames({
        'ballot-verify-status': true,
        'positive-background': verified.valid,
        'negative-background': !verified.valid,
        'animated': true,
        'flipInX': true,
      })}>
        {verified.valid
          ? <span>
            <Icon name="checkmark"/>
            Verified
          </span>
          : <span>
            <Icon name="cross"/>
            Invalid
          </span>}
        <span className="ballot-verify-date">
          {dateFormat(verified.createdAt, 'UTC:dd-mm-yyyy HH:MM:ss Z')}
        </span>
      </div>
    );
  },

  selectPageHandler: function(eventKey) {
    this.setState({page: parseInt(eventKey) - 1}, this.search);
  },

  renderPagination: function() {
    var numPages = this.state.transactions.getNumPagesByVoteId(
      this.props.params.voteId
    );
    var numItems = this.state.transactions.getNumItemsByVoteId(
      this.props.params.voteId
    );
    var transactions = this.state.transactions.getByVoteId(
      this.props.params.voteId,
      this.state.page
    );

    if (!!this.state.proofOfVote) {
      return null;
    }

    return (
      <div>
        <Pagination
          prev={true}
          next={true}
          first={true}
          last={true}
          ellipsis={true}
          boundaryLinks={true}
          items={this.state.searching && !!this.state.searchQuery ? 0 : numPages}
          maxButtons={5}
          activePage={this.state.page + 1}
          onSelect={this.selectPageHandler} />
        {!!transactions && !this.state.searching
          ? <div className="pagination-item-count hidden-xs">
            {this.state.page * 10 + 1} - {this.state.page * 10 + transactions.length} / {numItems}
          </div>
          : null}
      </div>
    );
  },
});

module.exports = BallotBox;
