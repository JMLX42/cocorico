var React = require('react');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');

var StringHelper = require('../../helper/StringHelper');

var VoteStore = require('../../store/VoteStore');

var VoteWidget = require('../../component/VoteWidget'),
  EmbeddedPage = require('../../component/EmbeddedPage');

var VoteWidgetPage = React.createClass({

  mixins: [
    Reflux.connect(VoteStore, 'votes'),
    ReactIntl.IntlMixin,
  ],

  postMessage: function(msg, vote) {
    console.log('postMessage: ' + msg, vote);
    if (!!window.parent) {
      // FIXME: we should not use a wildcard
      window.parent.postMessage(msg, '*');
    }
  },

  render: function() {
    var vote = this.state.votes.getById(this.props.params.voteId);
    var title = !!vote && !!vote.title
      ? StringHelper.toTitleCase(vote.title) + ' - ' + this.getIntlMessage('site.TITLE')
      : this.getIntlMessage('site.TITLE');

    return (
      <EmbeddedPage>
        <ReactDocumentTitle title={title}>
          <div className="content">
            <VoteWidget
              voteId={this.props.params.voteId}
              onSuccess={(v) => this.postMessage('voteSuccess', v)}
              onError={(v) => this.postMessage('voteError', v)}
              onComplete={(v) => this.postMessage('voteComplete', v)}
              onCancel={(v) => this.postMessage('voteCanceled', v)}/>
          </div>
        </ReactDocumentTitle>
      </EmbeddedPage>
    );
  },
});

module.exports = VoteWidgetPage;
