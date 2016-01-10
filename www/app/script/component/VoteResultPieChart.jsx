var React = require('react');
var ReactD3 = require('react-d3-components');
var ReactIntl = require('react-intl');

var PieChart = ReactD3.PieChart;

var VoteResultPieChart = React.createClass({

    mixins : [
        ReactIntl.IntlMixin
    ],

    render: function()
    {
        var color = {}
        color[this.getIntlMessage('text.VOTE_YES')] = '#4285F4';
        color[this.getIntlMessage('text.VOTE_NO')] = '#EB6864';
        color[this.getIntlMessage('text.VOTE_BLANK')] = '#999';

        var result = this.props.result;
        var numVotes = result.no + result.yes + result.blank;

        var percent = {};
        if (numVotes != 0)
        {
            percent[this.getIntlMessage('text.VOTE_YES')] = Math.round(result.yes / numVotes * 100);
            percent[this.getIntlMessage('text.VOTE_NO')] = Math.round(result.no / numVotes * 100);
            percent[this.getIntlMessage('text.VOTE_BLANK')] = Math.round(result.blank / numVotes * 100);
        }
        else
        {
            percent[this.getIntlMessage('text.VOTE_YES')] = 0;
            percent[this.getIntlMessage('text.VOTE_NO')] = 100;
            percent[this.getIntlMessage('text.VOTE_BLANK')] = 0;
        }

        var maxPercent = Math.max(
            percent[this.getIntlMessage('text.VOTE_YES')],
            percent[this.getIntlMessage('text.VOTE_NO')],
            percent[this.getIntlMessage('text.VOTE_BLANK')]
        );

        var percentColor = '';
        for (var v in percent)
            if (percent[v] == maxPercent)
            {
                percentColor = color[v];
                break;
            }

        var data = {
            values: [
                {x: this.getIntlMessage('text.VOTE_YES'),   y: result.yes},
                {x: this.getIntlMessage('text.VOTE_NO'),    y: result.no},
                {x: this.getIntlMessage('text.VOTE_BLANK'), y: result.blank}
            ]
        };

        var sort = null;

        return (
            <div>
                <PieChart
                    data={data}
                    width={600}
                    height={400}
                    colorScale={(e)=>color[e]}
                    outerRadius={150}
                    innerRadius={130}
                    sort={sort}/>
                <div style={{
                        position    : 'absolute',
                        top         : 160,
                        fontSize    : '50px',
                        left        : 175,
                        color       : percentColor,
                        textAlign   : 'center',
                        width       : '300px'}}>
                    {maxPercent}%
                </div>
            </div>
        );
    }
});

module.exports = VoteResultPieChart;
