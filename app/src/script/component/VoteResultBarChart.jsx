var React = require('react');
var Reflux = require('reflux');
var BarChart = require('react-chartjs-2').Bar;

var StringHelper = require('../helper/StringHelper');

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var LoadingIndicator = require('./LoadingIndicator');

var VoteResultBarChart = React.createClass({

  mixins: [
    Reflux.connect(VoteStore, 'votes'),
  ],

  componentWillMount: function() {
    VoteAction.showResults(this.props.vote.id);
  },

  render: function() {
    const vote = this.props.vote;
    const results = this.state.votes.getVoteResultByVoteId(vote.id);

    if (!results) {
      return (
        <LoadingIndicator/>
      );
    }

    const colors = [
      '#0074D9',
      '#FF851B',
      '#3D9970',
      '#006fa3',
      '#ff550c',
      '#00CE18',
      '#2ECC40',
      '#FFDC00',
      '#B10DC9',
      '#7FDBFF',
      '#F012BE',
      '#39CCCC',
      '#85144B',
    ];

    const data = {
      labels: vote.proposals.map((p) => StringHelper.toTitleCase(p)),
      datasets: vote.choices.map((c, k) => ({
        label: StringHelper.toTitleCase(c),
        data: results.map((r) => r[k]),
        backgroundColor: colors[k],
      }))
    };

    return (
      <BarChart
        data={data}
        options={{
          scales: {
            xAxes: [{
                stacked: true
            }],
            yAxes: [{
                stacked: true
            }]
        }}}/>
    );
  },
});

module.exports = VoteResultBarChart;
