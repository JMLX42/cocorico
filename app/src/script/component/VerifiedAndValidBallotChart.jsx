var React = require('react');

var DoughnutChart = require('react-chartjs-2').Doughnut;

var VerifiedAndValidBallotChart = React.createClass({

  render: function() {
    var vote = this.props.vote;
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

});

module.exports = VerifiedAndValidBallotChart;
