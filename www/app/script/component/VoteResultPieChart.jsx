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

        var data = {
            values: [
                {x: this.getIntlMessage('text.VOTE_YES'), y: result.yes},
                {x: this.getIntlMessage('text.VOTE_NO'), y: result.no},
            ]
        };

        var sort = null;

        return (
            <PieChart
                data={data}
                width={600}
                height={400}
                colorScale={(e)=>color[e]}
                margin={{top: 10, bottom: 10, left: 100, right: 100}}
                sort={sort}/>
        );
    }
});

module.exports = VoteResultPieChart;
