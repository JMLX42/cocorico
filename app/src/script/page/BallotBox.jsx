var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var classNames = require('classnames');

var TransactionStore = require('../store/TransactionStore'),
    VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var LoadingIndicator = require('../component/LoadingIndicator'),
    Title = require('../component/Title');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var BallotBox = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(TransactionStore, 'transactions'),
        Reflux.connect(VoteStore, 'votes'),
    ],

    componentWillMount: function() {
        VoteAction.getTransactions(this.props.params.voteId);
        VoteAction.show(this.props.params.voteId);
    },

    getVoteValueDisplayMessage: function(id) {
        var vote = this.state.votes.getById(this.props.params.voteId);

        var labels = (!!vote.labels && vote.labels.length != 0)
            ? vote.labels
            : [
                this.getIntlMessage('vote.VOTE_YES'),
                this.getIntlMessage('vote.VOTE_BLANK'),
                this.getIntlMessage('vote.VOTE_NO')
            ];

        return labels[id];
    },

    render: function()
    {
        return (
            <div className="page">
                <Grid>
                    <Row>
                        <Col md={12}>
                            {this.renderContent()}
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    },

    renderContent: function()
    {
        var transactions = this.state.transactions.getByVoteId(this.props.params.voteId);
        var vote = this.state.votes.getById(this.props.params.voteId);

        if (!transactions || !vote) {
            return <LoadingIndicator/>;
        }

        var hasLabels = vote.labels.length != 0;

        return (
            <table className="table table-hover table-ellipsis">
                <thead>
                    <tr>
                        <th>Transaction Hash</th>
                        <th>Voter</th>
                        <th>Proposal</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => {
                        return (
                            <tr>
                                <td className="truncate">{tx.transactionHash}</td>
                                <td className="truncate">{tx.args.voter}</td>
                                <td className="truncate">
                                    <span className={classNames({
                                        'label': true,
                                        'label-primary': hasLabels,
                                        'positive-background': !hasLabels && tx.args.proposal == 0,
                                        'neutral-background': !hasLabels && tx.args.proposal == 1,
                                        'negative-background': !hasLabels && tx.args.proposal == 2,
                                    })}>
                                        <Title text={this.getVoteValueDisplayMessage(tx.args.proposal)}/>
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
});

module.exports = BallotBox;
