var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Title = require('./Title');

var Button = ReactBootstrap.Button;

var VoteMatrixButtons = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
  ],

  getDefaultProps: function() {
    return {
      onVote: (e, ballotValue) => null,
      vote: null,
    };
  },

  getInitialState() {
    return {
      ballotValue: [],
    }
  },

  handleMatrixVote: (candidateIndex, labelIndex) => (e) => {
    let ballotValue = this.state.ballotValue;
    ballotValue[candidateIndex] = labelIndex;

    this.setState({ballotValue})
  },

  isMatrixFilled() {
    this.props.vote.candidateNames.map((candidate, candidateIndex) => {
      return (!!this.state.ballotValue[candidateIndex])
    }).reduce((a,b) => (a && b));
  },

  sendBallot() {
    this.props.onVote(e, this.state.ballotValue);
  },

  render: function() {
    var labels = this.props.vote.labels;
    var candidates = this.props.vote.candidateNames;

    return (
        <form>
          <table>
            <thead>
            <tr>
              <td>
                /
              </td>
              {
                candidates.map((candidate, candidateIndex) => (
                  <td key={candidateIndex}>
                    <Title text={candidate}/>
                    {/*{candidate}*/}
                  </td>
                ))
              }
            </tr>
            </thead>
            <tbody>
            {
              labels.map((label, labelIndex) => (
                  <tr key={labelIndex}>
                    <td>
                      <Title text={label}/>
                      {/*{label}*/}
                    </td>
                    {
                      candidates.map((candidate, candidateIndex) => (
                          <td key={candidateIndex}>
                            <input type="radio" name={"ballot-"+candidateIndex} value={labelIndex}
                                   onChange={this.handleMatrixVote(candidateIndex, labelIndex)}/>
                          </td>
                      ))
                    }
                  </tr>
              ))
            }
            </tbody>
          </table>

          <Button disabled={this.isMatrixFilled}
                  className="btn-vote btn-primary"
                  onClick={this.sendBallot}>
            {this.getIntlMessage('vote.VALIDATE_BALLOT')}
          </Button>
        </form>
    );
  },
});

module.exports = VoteMatrixButtons;
