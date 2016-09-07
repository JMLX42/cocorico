var React = require('react');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');

var PropTypes = React.PropTypes;

var StringHelper = require('../../helper/StringHelper');

var VoteAction = require('../../action/VoteAction'),
    BallotAction = require('../../action/BallotAction');

var VoteStore = require('../../store/VoteStore');

var VoteWidget = require('../../component/VoteWidget'),
    Footer = require('../../component/Footer'),
    LoadingIndicator = require("../../component/LoadingIndicator");

var VoteWidgetPage = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(VoteStore, 'votes')
    ],

    componentWillMount: function() {
        VoteAction.show(this.props.params.voteId);
        BallotAction.showCurrentUserBallot(this.props.params.voteId, true);
    },

    render: function() {
        var vote = this.state.votes.getById(this.props.params.voteId);

        return (
            <div>
                {!!vote
                    ? <ReactDocumentTitle title={StringHelper.toTitleCase(vote.title) + ' - ' + this.getIntlMessage('site.TITLE')}>
                        <div className="content">
                            <VoteWidget modal={false} vote={vote}/>
                        </div>
                    </ReactDocumentTitle>
                    : <div className="text-center" style={{paddingTop:'200px'}}>
                        <LoadingIndicator/>
                    </div>}
                <Footer/>
            </div>
        );
    }
});

module.exports = VoteWidgetPage;
