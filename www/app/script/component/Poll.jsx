var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var PollAction = require('../action/PollAction'),
    UserAction = require('../action/UserAction');

var VoteButtonBar = require('./VoteButtonBar'),
    LoginButton = require('./LoginButton');

var VoteStore = require('../store/VoteStore'),
    UserStore = require('../store/UserStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Poll = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(VoteStore, 'votes'),
        Reflux.connect(UserStore, 'users')
    ],

    componentDidMount: function()
    {
        PollAction.show(this.props.poll);
        UserAction.requireLogin();

        this.listenTo(PollAction.vote, (pollId, value) => {
            PollAction.show(this.props.poll);
        });
    },

    render: function()
    {
        if (!this.props.poll)
            return null;

        var vote = this.state.votes
            ? this.state.votes.getVoteByPollId(this.props.poll.id)
            : null;

        var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

		return (
            <div className="poll">
                <div className="section">
                    <Grid>
                        <Row>
                            <h1 className="poll-title">{this.props.poll.title}</h1>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <div className="poll-text">
                                <Markdown source={this.props.poll.content.extended.md} />
                            </div>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <h2 className="section-title">{this.getIntlMessage('poll.ADDITIONAL_DATA')}</h2>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <h2 className="section-title">{this.getIntlMessage('poll.PARTICIPATION')}</h2>
                            {!!currentUser
                                ? !!this.state.votes && !vote
                                    ? <VoteButtonBar pollId={this.props.poll.id}/>
                                    : <div>
                                        <FormattedMessage message={this.getIntlMessage('poll.ALREADY_VOTED')}
                                                          value={vote ? this.getIntlMessage('poll.VOTE_' + vote.value.toUpperCase()) : ''}
                                                          date={<FormattedTime value={vote ? vote.time : Date.now()}/>}/>
                                      </div>
                                : <div>
                                    {this.getIntlMessage('poll.LOGIN_REQUIRED')} <LoginButton />
                                  </div>}
                        </Row>
                    </Grid>
                </div>
            </div>
		);
	}
});

module.exports = Poll;
