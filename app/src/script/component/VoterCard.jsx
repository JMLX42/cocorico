var React = require('react');
var Reflux = require('reflux');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var VoterCard = React.createClass({

  mixins: [
    Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
  ],

  render: function() {
    var voterCard = this.state.blockchainAccounts.getVoterCardByVoteId(
      this.props.voteId
    );

    if (!voterCard) {
      return null;
    }

    return (
      <div dangerouslySetInnerHTML={{__html: voterCard}} id={this.props.id}/>
    );
  },

});

module.exports = VoterCard;
