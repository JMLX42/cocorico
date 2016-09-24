var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var PrintHTMLElement = require('print-html-element');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var VoterCard = require('./VoterCard');

var Button = ReactBootstrap.Button;

var VoterCardPrintButton = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
  ],

  getDefaultProps: function() {
    return {
      onClick: (e) => null,
    };
  },

  getInitialState: function() {
    return {
      elementId: 'proof-of-vote-' + this.props.voteId,
    };
  },

  onClick: function(e) {
    PrintHTMLElement.printElement(
      document.getElementById(this.state.elementId),
      { printMode: 'popup' }
    );

    this.props.onClick(e);
  },

  render: function() {
    var voterCard = this.state.blockchainAccounts.getVoterCardByVoteId(
      this.props.voteId
    );

    if (!voterCard) {
      return null;
    }

    return (
      <span>
        <Button
          className={this.props.className
            ? this.props.className
            : 'btn btn-primary'}
          onClick={this.onClick}>
          <span className="icon-printer"/>
          {this.getIntlMessage('vote.PRINT_VOTER_CARD')}
        </Button>
        <div className="visible-print-block" id={this.state.elementId}
          style={{width:'50%'}}>
          <VoterCard voteId={this.props.voteId}/>
        </div>
      </span>
    );
  },

});

module.exports = VoterCardPrintButton;
