var React = require('react');
var ReactD3 = require('react-d3-components');
var ReactIntl = require('react-intl');

var PieChart = ReactD3.PieChart;

var VoteResultPieChart = React.createClass({

  mixins : [
    ReactIntl.IntlMixin,
  ],

  shouldComponentUpdate: function(newProps) {
    for (var prop in newProps.result)
      if (newProps.result[prop] !== this.props.result[prop])
        return true;

    return false;
  },

  render: function() {
    var result = {
      yes: this.props.result[0],
      blank: this.props.result[1],
      no: this.props.result[2],
    };
    var numVotes = result.no + result.yes + result.blank;

    var percent = {};
    if (numVotes !== 0) {
      percent[this.getIntlMessage('vote.VOTE_YES')] = Math.round(result.yes / numVotes * 100);
      percent[this.getIntlMessage('vote.VOTE_NO')] = Math.round(result.no / numVotes * 100);
      percent[this.getIntlMessage('vote.VOTE_BLANK')] = Math.round(result.blank / numVotes * 100);
    } else {
      percent[this.getIntlMessage('vote.VOTE_YES')] = 0;
      percent[this.getIntlMessage('vote.VOTE_NO')] = 100;
      percent[this.getIntlMessage('vote.VOTE_BLANK')] = 0;
    }

    var labels = {
      yes : this.getIntlMessage('vote.VOTE_YES')
        + ' (' + percent[this.getIntlMessage('vote.VOTE_YES')] + '%)',
      no : this.getIntlMessage('vote.VOTE_NO')
        + ' (' + percent[this.getIntlMessage('vote.VOTE_NO')] + '%)',
      blank : this.getIntlMessage('vote.VOTE_BLANK')
        + ' (' + percent[this.getIntlMessage('vote.VOTE_BLANK')] + '%)',
    };

    var color = {};
    color[labels.yes] = '#2ecc71';
    color[labels.no] = '#e74c3c';
    color[labels.blank] = '#95a5a6';

    var data = {values : [
      {x : labels.yes, y : result.yes},
      {x : labels.no, y : result.no},
      {x : labels.blank, y : result.blank},
    ]};

    return (
      <div>
        <PieChart
            data={data}
            width={670}
            height={400}
            labelRadius={170}
            colorScale={(e)=>color[e]}
            outerRadius={150}
            innerRadius={130}
            margin={{top: 0, right: 0, bottom: 0, left: 0}}/>
      </div>
    );
  },
});

module.exports = VoteResultPieChart;
