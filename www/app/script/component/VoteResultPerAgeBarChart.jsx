var React = require('react');
var ReactD3 = require('react-d3-components');
var ReactIntl = require('react-intl');
var d3 = require('d3');

var BarChart = ReactD3.BarChart;

module.exports = React.createClass({

    mixins : [
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function(props)
    {
        return {
            width   : 950,
            height  : 300
        }
    },

    shouldComponentUpdate: function(newProps)
    {
        for (var date in newProps.result)
            if (newProps.result[date] != this.props.result[date])
                return true;

        return false;
    },

    render: function()
    {
        var color = {
            yes     : '#4285F4',
            no      : '#EB6864',
            blank   : '#999'
        };

        var result = this.props.result;
        var data = [];

        for (var ballotValue in color)
        {
            var values = [];

            for (var i = 0; i <= 100; ++i)
            {
                var voterAge = i.toString();

                if (voterAge in result)
                {
                    values.push({
                        x : voterAge,
                        y : result[voterAge][ballotValue]
                    });
                }
            }

            data.push({label : ballotValue, values : values});
        }

        return (
            <BarChart
               data={data}
               width={this.props.width}
               height={this.props.height}
               margin={{top: 10, bottom: 50, left: 50, right: 20}}
               colorScale={(e)=>color[e]}
               yAxis={{tickFormat : d3.format("d")}}
            />
        );
    }
});
