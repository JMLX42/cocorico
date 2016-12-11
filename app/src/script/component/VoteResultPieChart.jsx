var React = require('react');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');
var DoughnutChart = require('react-chartjs-2').Doughnut;

var StringHelper = require('../helper/StringHelper');

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var LoadingIndicator = require('./LoadingIndicator');

var VoteResultPieChart = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(VoteStore, 'votes'),
  ],

  componentWillMount: function() {
    VoteAction.showResults(this.props.vote.id);
  },

  getColors: function(vote) {
    return !!vote.labels.length
      ? [
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
      ]
      : [
        '#2ecc71',
        '#bdc3c7',
        '#e74c3c',
      ]
  },

  render: function() {
    var vote = this.props.vote;
    var data = this.state.votes.getVoteResultByVoteId(vote.id);

    if (!data) {
      return (
        <LoadingIndicator/>
      );
    }

    var labels = !!vote.labels.length
      ? vote.labels
      : [
        this.getIntlMessage('vote.VOTE_YES').toLowerCase(),
        this.getIntlMessage('vote.VOTE_BLANK').toLowerCase(),
        this.getIntlMessage('vote.VOTE_NO').toLowerCase(),
      ];
    var colors = this.getColors(vote);

    return (
      <DoughnutChart data={{
        labels: labels.map((label)=>StringHelper.toTitleCase(label)),
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            hoverBackgroundColor: colors,
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
});

module.exports = VoteResultPieChart;
