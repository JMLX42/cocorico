var React = require('react');
var Reflux = require('reflux');

var ProofOfVoteStore = require('../store/ProofOfVoteStore');

var VoteAction = require('../action/VoteAction');

var PropTypes = React.PropTypes;

var ProofOfVote = React.createClass({

    mixins: [
        Reflux.connect(ProofOfVoteStore, 'proofOfVote')
    ],

    componentWillMount: function() {
        VoteAction.generateProofOfVote(this.props.billId);
    },

    render: function() {
        var pov = this.state.proofOfVote.getProofOfVoteByBillId(
            this.props.billId
        );

        if (!pov) {
            return;
        }

        return (
            <div dangerouslySetInnerHTML={{__html: pov}}
                id={this.props.id}/>
        );
    }

});

module.exports = ProofOfVote;
