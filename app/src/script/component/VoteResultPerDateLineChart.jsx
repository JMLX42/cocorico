var React = require('react');
var ReactD3 = require('react-d3-components');
var ReactIntl = require('react-intl');
var d3 = require('d3');

var LineChart = ReactD3.LineChart;

module.exports = React.createClass({

  mixins : [
    ReactIntl.IntlMixin,
  ],

  getDefaultProps: function(props) {
    return {
      width   : 580,
      height  : 300,
    }
  },

  shouldComponentUpdate: function(newProps) {
    for (var date in newProps.result)
      if (newProps.result[date] !== this.props.result[date])
        return true;

    return false;
  },

  render: function() {
    var color = {
      yes     : '#4285F4',
      no      : '#EB6864',
      blank   : '#999',
    };

    var result = this.props.result;
    var dates = [];
    var dateFields = [];
    var data = [];
    var total = {};

    for (var ballotValue in result) {
      total[ballotValue] = 0;
      for (var dateStr in result[ballotValue])
        if (dateFields.indexOf(dateStr) < 0) {
          dateFields.push(dateStr);
          dates.push(new Date(dateStr));
        }
    }

    dates.sort().reverse();
    dates = [dates[0], dates[dates.length - 1]];
    dates[1].setDate(dates[1].getDate() + 2);

    dateFields.push(dates[1]);
    dateFields.sort();

    for (var ballotValue in result) {
      var values = [];
      for (var dateStr of dateFields) {
        if (dateStr in result[ballotValue])
          total[ballotValue] += result[ballotValue][dateStr];

        values.push({x : new Date(dateStr), y : total[ballotValue]});
      }

      data.push({label : ballotValue, values : values});
    }

    var xScale = d3.time.scale().domain(dates).range([0, 650]);

    return (
      <LineChart
         data={data}
         width={this.props.width}
         height={this.props.height}
         margin={{top: 10, bottom: 50, left: 50, right: 20}}
         colorScale={(e)=>color[e]}
         xScale={xScale}
         xAxis={{
           tickValues   : xScale.ticks(d3.time.day, 2),
           tickFormat   : d3.time.format('%d/%m/%y'),
         }}
         yAxis={{
           tickFormat   : d3.format('d'),
         }}/>
    );
  },
});
