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
    UserStore = require('../store/UserStore'),
    PollStore = require('../store/PollStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var Poll = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(PollStore, 'polls'),
        Reflux.connect(VoteStore, 'votes'),
        Reflux.connect(UserStore, 'users')
    ],

    componentDidMount: function()
    {
        PollAction.show(this.props.slug);
        UserAction.requireLogin();

        this.listenTo(PollAction.vote, (pollId, value) => {
            PollAction.show(this.props.slug);
        });
    },

    componentWillReceiveProps: function(props)
    {
        PollAction.show(props.slug);
    },

    render: function()
    {
        var poll = this.state.polls
            ? this.state.polls.getBySlug(this.props.slug)
            : null;

        if (!poll)
            return null;

        var vote = this.state.votes
            ? this.state.votes.getVoteByPollId(poll.id)
            : null;

        console.log(vote);

        var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

		return (
            <div className="poll">
                <div className="section">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <h1 className="poll-title">{poll.title}</h1>
                            </Col>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <div className="poll-text">
                                    <Markdown source={poll.content.md} />
                                </div>
                            </Col>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <h2 className="section-title">{this.getIntlMessage('poll.ADDITIONAL_DATA')}</h2>
                            </Col>
                        </Row>
                    </Grid>
                </div>
                <div className="section">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <h2 className="section-title">{this.getIntlMessage('poll.PARTICIPATION')}</h2>
                                {!!currentUser
                                    ? !!this.state.votes && !vote
                                        ? <VoteButtonBar pollId={poll.id}/>
                                        : <div>
                                            <FormattedMessage message={this.getIntlMessage('poll.ALREADY_VOTED')}
                                                              value={vote ? this.getIntlMessage('poll.VOTE_' + vote.value.toUpperCase()) : ''}
                                                              date={<FormattedTime value={vote ? vote.time : Date.now()}/>}/>
                                          </div>
                                    : <div>
                                        {this.getIntlMessage('poll.LOGIN_REQUIRED')} <LoginButton />
                                      </div>}
                            </Col>
                        </Row>
                    </Grid>
                </div>
            </div>
		);
	}
});

module.exports = Poll;
