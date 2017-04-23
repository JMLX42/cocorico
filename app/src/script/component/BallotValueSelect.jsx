var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Title = require('./Title');

var StringHelper = require('./../helper/StringHelper');

var Button = ReactBootstrap.Button;

var BallotValueSelect = React.createClass({

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
    const proposals = this.props.vote.proposals;
    const choices = this.props.vote.choices;

    return (
      <form className="form-horizontal">
        {this.state.proposalOrder.map((p) =>
          <div className="form-group">
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-2">
              <label className="control-label" for="formGroupInputLarge">
                <Title text={proposals[p]}/>
              </label>
            </div>
            <div className="col-xs-12 col-sm-6 col-md-4 col-lg-2">
              <select className="form-control"
                onChange={(e) => this.setBallotValue(p, parseInt(e.target.value))}>
                <option value="-1" disabled={true} selected={true}>
                  {this.getIntlMessage('vote.DEFAULT_BALLOT_VALUE_SELECT_OPTION')}
                </option>
                {choices.map((choice, c) =>
                  <option value={c} key={'ballot-' + c}>
                    {StringHelper.toTitleCase(choice)}
                  </option>
                )}
              </select>
            </div>
          </div>
        )}
        <div className="form-group">
          <div className="col-xs-12 col-sm-offset-4 col-lg-offset-2 col-sm-8">
            <Button disabled={this.state.ballotValue.filter((v) => v === -1).length !== 0}
                className="btn-vote btn-primary"
                onClick={(e) => this.props.onVote(e, this.state.ballotValue)}>
                {this.getIntlMessage('vote.VALIDATE_BALLOT')}
            </Button>
          </div>
        </div>
      </form>
    );
  },
});

module.exports = BallotValueSelect;
