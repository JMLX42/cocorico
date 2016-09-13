var React = require('react');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');

var PropTypes = React.PropTypes;

var StringHelper = require('../../helper/StringHelper');

var VoteAction = require('../../action/VoteAction'),
    BallotAction = require('../../action/BallotAction');

var VoteStore = require('../../store/VoteStore'),
    UserStore = require('../../store/UserStore');

var VoteWidget = require('../../component/VoteWidget'),
    EmbeddedPage = require('../../component/EmbeddedPage'),
    LoadingIndicator = require("../../component/LoadingIndicator"),
    AuthenticationError = require('../../component/AuthenticationError');

var VoteWidgetPage = React.createClass({

    mixins: [
        Reflux.connect(VoteStore, 'votes'),
        ReactIntl.IntlMixin
    ],

    componentWillMount: function() {
    },

    postMessage: function(msg, vote) {
        if (!!window.parent && !!vote && !!vote.url) {
            window.parent.postMessage(msg, vote.url);
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
                            modal={false}
                            voteId={this.props.params.voteId}
                            onSuccess={(v) => this.postMessage('voteSuccess', v)}
                            onError={(v) => this.postMessage('voteError', v)}
                            onComplete={(v) => this.postMessage('voteComplete', v)}
                            onCancel={(v) => this.postMessage('voteCanceled', v)}/>
                    </div>
                </ReactDocumentTitle>
            </EmbeddedPage>
        );
    }
});

module.exports = VoteWidgetPage;
