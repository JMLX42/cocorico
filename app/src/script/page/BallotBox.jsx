var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var LoadingIndicator = require('../component/LoadingIndicator'),
  Title = require('../component/Title'),
  Hint = require('../component/Hint'),
  BallotSearch = require('../component/BallotSearch'),
  VoteResultCharts = require('../component/VoteResultCharts');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col;

var BallotBox = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(VoteStore, 'votes'),
  ],

  componentWillMount: function() {
    VoteAction.show(this.props.params.voteId);
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
          <h1>
            <Title text={vote.title}/>&nbsp;
            <small>{this.getIntlMessage('title.BALLOT_BOX')}</small>
          </h1>
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

    return (
      <div>
        <Grid>
          {this.renderTitle(vote)}
        </Grid>
        <VoteResultCharts vote={vote}/>
        <BallotSearch vote={vote}/>
      </div>
    );
  },
});

module.exports = BallotBox;
