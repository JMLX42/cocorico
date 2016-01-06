var React = require('react');
var ReactD3 = require('react-d3-components');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');

var PieChart = ReactD3.PieChart;

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var VoteResultPieChart = React.createClass({

    mixins : [
        ReactIntl.IntlMixin,
        Reflux.connect(VoteStore, 'votes')
    ],

    componentWillMount : function()
    {
        VoteAction.showTextVoteResult(this.props.textId);
    },

    render: function()
    {
        var result = this.state.votes
            ? this.state.votes.getVoteResultByTextId(this.props.textId)
            : null;

        if (!result)
            return null;

        var color = {}
        color[this.getIntlMessage('text.VOTE_YES')] = '#4285F4';
        color[this.getIntlMessage('text.VOTE_NO')] = '#EB6864';

        var percentText = result.yes == 0 || result.no == 0
            ? 100
            : result.yes >= result.no
                ? Math.round(result.yes / (result.no + result.yes) * 100)
                : Math.round(result.no / (result.no + result.yes) * 100);
        var percentColor = result.yes >= result.no
            ? color[this.getIntlMessage('text.VOTE_YES')]
            : color[this.getIntlMessage('text.VOTE_NO')];

        var data = {
            values: [
                {x: this.getIntlMessage('text.VOTE_YES'), y: result.yes},
                {x: this.getIntlMessage('text.VOTE_NO'), y: result.no},
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
                    {percentText}%
                </div>
            </div>
        );
    }
});

module.exports = VoteResultPieChart;
