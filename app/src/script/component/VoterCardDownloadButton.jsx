var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var Button = ReactBootstrap.Button;

var VoterCardDownloadButton = React.createClass({

  mixins: [
    Reflux.connect(BlockchainAccountStore, 'blockchainAccounts'),
    ReactIntl.IntlMixin,
  ],

  getDefaultProps: function() {
    return {
      className: 'btn btn-primary',
      onClick: (e) => null,
    };
  },

  onClick: function(e) {
    var voterCard = this.state.blockchainAccounts.getVoterCardByVoteId(
      this.props.voteId
    );

    // IE workaround for not supporting the download anchor attribute
    // FIXME: IE8 workaround https://jsfiddle.net/gokpfr00/41/
    if (window.navigator.msSaveBlob)
      window.navigator.msSaveBlob(new Blob([voterCard]), this.props.filename);

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
      !!window.navigator.msSaveBlob
        ? <Button className={this.props.className} onClick={this.onClick}>
          <span className="icon-download"/>
          {this.getIntlMessage('vote.DOWNLOAD_VOTER_CARD')}
        </Button>
        : <a className={this.props.className}
            href={'data:image/svg+xml;utf8,' + voterCard}
            download={this.props.filename}
            onClick={this.onClick}>
            <span className="icon-download"/>
            {this.getIntlMessage('vote.DOWNLOAD_VOTER_CARD')}
        </a>
    );
  },

});

module.exports = VoterCardDownloadButton;
