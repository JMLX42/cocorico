var React = require('react');

var DoughnutChart = require('react-chartjs-2').Doughnut;

var VerifiedBallotChart = React.createClass({

  render: function() {
    var vote = this.props.vote;

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

});

module.exports = VerifiedBallotChart;
