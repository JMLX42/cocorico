var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var VerifiedBallotChart = require('../component/VerifiedBallotChart'),
  VerifiedAndValidBallotChart = require('../component/VerifiedAndValidBallotChart'),
  VoteResultPieChart = require('../component/VoteResultPieChart');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col;

var VoteResult = React.createClass({

  render: function() {
    var vote = this.props.vote;
    var numVerifiedBallots = vote.numValidBallots + vote.numInvalidBallots;

    return (
      <Grid>
        <Row className="ballot-box-recount">
          <Col md={4} sm={6} xs={12} className="text-center">
            <VoteResultPieChart vote={vote}/>
          </Col>
          <Col md={2} sm={3} smPush={0} xs={6} className="text-center">
            <VerifiedAndValidBallotChart vote={vote}/>
            {numVerifiedBallots !== 0
              ? <span>
                {Math.floor(vote.numValidBallots / numVerifiedBallots * 100.0)}%
                valid verified ballots
              </span>
              : <span>Not enough data yet.</span>}
          </Col>
          <Col md={2} sm={3} smPush={0} xs={6} className="text-center">
            <VerifiedBallotChart vote={vote}/>
            <span>
              {Math.floor(numVerifiedBallots / vote.numBallots * 100.0)}%
              verified ballots
            </span>
          </Col>
        </Row>
      </Grid>
    );
  },

});

module.exports = VoteResult;
