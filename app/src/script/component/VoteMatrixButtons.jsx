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
      ballotValue: {},
    }
  },

  handleMatrixVote: (candidate, label) => (e) => {
    let ballotValue = Object.assign({}, this.state.ballotValue);
    ballotValue[candidate] = label; // TODO order ?
    this.setState({ballotValue})
  },

  isMatrixFilled() {
    this.props.vote.candidates.map(candidate => {
      return (!!this.state.ballotValue[candidate])
    }).reduce((a,b) => (a && b));
  },

  render: function() {
    var labels = this.props.vote.labels;
    var candidates = this.props.vote.candidates;

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
                                   onChange={this.handleMatrixVote(candidate, label)}/>
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
                  onClick={(e) => this.props.onVote(e, this.state.ballotValue)}>
            {this.getIntlMessage('vote.VALIDATE_BALLOT')}
          </Button>
        </form>
    );
  },
});

module.exports = VoteMatrixButtons;
