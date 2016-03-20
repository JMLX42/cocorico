var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var VoteButton = require('./VoteButton'),
    UnvoteButton = require('./UnvoteButton'),
    LoadingIndicator = require('./LoadingIndicator');

var ServiceStatusAction = require('../action/ServiceStatusAction');

var ServiceStatusStore = require('../store/ServiceStatusStore'),
    ConfigStore = require('../store/ConfigStore');

var ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var VoteButtonBar = React.createClass({

    mixins: [
        Reflux.connect(ConfigStore, 'config'),
        Reflux.connect(ServiceStatusStore, 'serviceStatus'),
        ReactIntl.IntlMixin,
        ForceAuthMixin
    ],

    componentWillMount: function()
    {
        if (this.props.bill.voteContractAddress)
            ServiceStatusAction.showStatus();
    },

    renderVoteButtons: function()
    {
        return (
            <ButtonToolbar className="bill-center">
                <VoteButton message="bill.VOTE_YES"
                    bill={this.props.bill.id}
                    value="yes"
                    className="btn-vote-yes"/>
                <VoteButton message="bill.VOTE_BLANK"
                    bill={this.props.bill.id}
                    value="blank"
                    className="btn-vote-blank"/>
                <VoteButton message="bill.VOTE_NO"
                    bill={this.props.bill.id}
                    value="no"
                    className="btn-vote-no"/>
            </ButtonToolbar>
        );
    },

    render: function()
    {
        var ballot = this.props.ballot;
        var validBallot = ballot && !ballot.error && ballot.status == 'complete'
            && ballot.value;

        return (
            <div className={validBallot ? 'voted-' + ballot.value : ''}>
                <Grid>
                    <Row className="section section-no-border section-vote">
                        <Col md={12}>
                            {this.renderChildren()}
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    },

    renderChildren: function()
    {
        var ballot = this.props.ballot;
        var bill = this.props.bill;

        if (!this.isAuthenticated())
        {
            if (bill.status != 'published')
            {
                return (
                    <p className="hint">
                        {this.renderLoginMessage(this.getIntlMessage('bill.LOGIN_REQUIRED'))}
                    </p>
                );
            }
            else
            {
                return (
                    <p className="hint">
                        {this.getIntlMessage('bill.TOO_LATE_TO_VOTE')}
                    </p>
                );
            }
        }

        if (this.props.bill.voteContractAddress && !this.state.serviceStatus)
            return <LoadingIndicator/>;

        var system = this.state.serviceStatus
            ? this.state.serviceStatus.getSystemStatus()
            : null;

		return (
            <div>
                <h2 className="section-title">
                    {this.getIntlMessage('bill.YOUR_VOTE')}
                    {!!bill.voteContractAddress
                        ? <span className="small">
                            <span className="icon-secured"/>
                            {this.getIntlMessage('bill.BLOCKCHAIN_SECURED')}
                        </span>
                        : <span/>}
                </h2>
                {bill.voteContractAddress && (!system.blockchainNode || !system.blockchainMiner)
                    ? <span>
                        {this.getIntlMessage('bill.VOTE_UNAVAILABLE')}
                    </span>
                    : !this.state.config.capabilities.bill.vote
                        ? <p className="hint">
                            {this.getIntlMessage('bill.VOTE_DISABLED')}
                        </p>
                        : !ballot || ballot.error == 404 || ballot.status != 'complete'
                            ? bill.status == 'vote'
                                ? !!ballot && ballot.status == 'pending'
                                    ? <LoadingIndicator text={this.getIntlMessage('bill.VOTE_PENDING')}/>
                                    : this.renderVoteButtons()
                                : <p className="hint">
                                    {this.getIntlMessage('bill.TOO_LATE_TO_VOTE')}
                                </p>
                            : <div>
                                <FormattedMessage message={this.getIntlMessage('bill.ALREADY_VOTED')}
                                    value={ballot && ballot.value ? this.getIntlMessage('bill.VOTE_' + ballot.value.toUpperCase()) : ''}
                                    date={<FormattedTime value={ballot && ballot.time ? ballot.time : Date.now()}/>}/>
                                {bill.status == 'vote'
                                    ? <div>
                                        <UnvoteButton bill={bill}/>
                                    </div>
                                    : <div/>}
                            </div>}
            </div>
		);
	}
});

module.exports = VoteButtonBar;
