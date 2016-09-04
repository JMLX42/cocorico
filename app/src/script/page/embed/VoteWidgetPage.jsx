var React = require('react');
var Reflux = require('reflux');

var PropTypes = React.PropTypes;

var VoteAction = require('../../action/VoteAction');

var VoteStore = require('../../store/VoteStore');

var VoteWidget = require('../../component/VoteWidget');

var VoteWidgetPage = React.createClass({

    mixins: [
        Reflux.connect(VoteStore, 'votes')
    ],

    componentWillMount: function() {
        VoteAction.show(this.props.params.voteId);
    },

    render: function() {
        var vote = this.state.votes.getById(this.props.params.voteId);

        if (!vote) {
            return null;
        }

        return (
            <VoteWidget modal={false} vote={vote}/>
        );
    }
});

module.exports = VoteWidgetPage;
