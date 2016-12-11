var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Title = require('./Title');

var Button = ReactBootstrap.Button;

var BallotValueRadioButtons = React.createClass({

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
    const numProposals = Math.max(1, this.props.vote.proposals.length);

    return {
      proposalOrder: this.shuffle(
        Array.apply(null, Array(numProposals)).map((v, k) => k)
      ),
      ballotValue: new Array(numProposals).fill(-1),
    }
  },

  renderList: function() {
    const proposals = this.props.vote.proposals;

    return (
      <form>
        <ul className="list-unstyled" >
          {proposals.map((label, index) => {
            return (
              <li>
                <label className="vote-label">
                  <input type="radio" key={index} value={index}
                    onChange={(e) => this.setBallotValue(0, index)}/>
                  <i>
                    <Title text={label}/>
                  </i>
                </label>
              </li>
            )
          })}
        </ul>
      </form>
    );
  },

  // http://stackoverflow.com/a/6274381
  shuffle: function(a) {
    for (let i = a.length; i; i--) {
      let j = Math.floor(Math.random() * i);
      [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }

    return a;
  },

  setBallotValue: function(index, value) {
    const ballotValue = this.state.ballotValue;

    ballotValue[index] = value;
    this.setState({ballotValue: ballotValue});
  },

  render: function() {
    return (
      <div>
        {this.renderList()}
        <Button disabled={this.state.ballotValue.filter((v) => v === -1).length !== 0}
            className="btn-vote btn-primary"
            onClick={(e) => this.props.onVote(e, this.state.ballotValue)}>
            {this.getIntlMessage('vote.VALIDATE_BALLOT')}
        </Button>
      </div>
    );
  },
});

module.exports = BallotValueRadioButtons;
