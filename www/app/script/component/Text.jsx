var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var StringHelper = require('../helper/StringHelper');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextAction = require('../action/TextAction'),
    UserAction = require('../action/UserAction'),
    VoteAction = require('../action/VoteAction');

var VoteButtonBar = require('./VoteButtonBar'),
    LoginButton = require('./LoginButton'),
    UnvoteButton = require('./UnvoteButton'),
    ArgumentEditor = require('./ArgumentEditor'),
    ArgumentTab = require('./ArgumentTab'),
    ContributionTabs = require('./ContributionTabs'),
    LikeButtons = require('./LikeButtons'),
    Hint = require('./Hint'),
    VoteResult = require('./VoteResult');

var BallotStore = require('../store/BallotStore'),
    UserStore = require('../store/UserStore'),
    TextStore = require('../store/TextStore'),
    SourceStore = require('../store/SourceStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab,
    Button = ReactBootstrap.Button;

var Text = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(TextStore, 'texts'),
        Reflux.connect(BallotStore, 'ballots'),
        Reflux.connect(UserStore, 'users'),
        Reflux.connect(SourceStore, 'sources')
    ],

    componentDidMount: function()
    {
        TextAction.show(this.props.textId);
        TextAction.showCurrentUserVote(this.props.textId);

        this.listenTo(VoteAction.vote, (textId) => {
            TextAction.show(this.props.textId);
        });
    },

    componentWillReceiveProps: function(nextProps)
    {
        if (nextProps.textId != this.props.textId)
            TextAction.show(nextProps.textId);
    },

    render: function()
    {
        var text = this.state.texts
            ? this.state.texts.getById(this.props.textId)
            : null;

        if (!text)
            return null;

        var ballot = this.state.ballots
            ? this.state.ballots.getBallotByTextId(text.id)
            : null;

        var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

        var sources = this.state.sources
            ? this.state.sources.getSourcesByTextId(text.id)
            : null;

		return (
            <ReactDocumentTitle title={StringHelper.toTitleCase(text.title) + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="text">
                    <Grid>
                        <Row className="section">
                            <Col md={12}>
                                <h1 className="text-title">{text.title}</h1>
                                <LikeButtons likeAction={TextAction.like} resource={text}/>
                            </Col>
                        </Row>

                        <Row className="section">
                            <Col md={12}>
                                <div className="text-content">
                                    <Markdown>
                                        {text.content.md}
                                    </Markdown>
                                </div>
                            </Col>
                        </Row>
                    </Grid>

                    {text.status == 'review'
                        ? <div className="section section-hint cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <Hint pageSlug="astuce-etape-revision"
                                            disposable={true}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {text.status == 'debate'
                        ? <div className="section section-hint cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <Hint pageSlug="astuce-etape-debat"
                                            disposable={true}/>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    <Grid>
                        <Row className="section" style={{border:'none'}}>
                            <ContributionTabs text={text} editable={true} tab={this.props.tab}/>
                        </Row>
                    </Grid>

                    {text.status == 'vote' || text.status == 'published'
                        ? <div className={this.state.ballots && ballot && !ballot.error && ballot.value ? 'voted-' + ballot.value : ''}>
                            <Grid>
                                <Row className="section">
                                    <Col md={12}>
                                        <h2 className="section-title">{this.getIntlMessage('text.YOUR_VOTE')}</h2>
                                        {!currentUser
                                            ? text.status != 'published'
                                                ? <p className="hint">
                                                    {this.getIntlMessage('text.LOGIN_REQUIRED')} <LoginButton />
                                                </p>
                                                : <p className="hint">
                                                    {this.getIntlMessage('text.TOO_LATE_TO_VOTE')}
                                                </p>
                                            : !!this.state.ballots && (!ballot || ballot.error == 404)
                                                ? text.status == 'vote'
                                                    ? <VoteButtonBar textId={text.id}/>
                                                    : <p className="hint">
                                                        {this.getIntlMessage('text.TOO_LATE_TO_VOTE')}
                                                    </p>
                                                : <div>
                                                    <FormattedMessage message={this.getIntlMessage('text.ALREADY_VOTED')}
                                                        value={ballot && ballot.value ? this.getIntlMessage('text.VOTE_' + ballot.value.toUpperCase()) : ''}
                                                        date={<FormattedTime value={ballot && ballot.time ? ballot.time : Date.now()}/>}/>
                                                    {text.status == 'vote'
                                                        ? <div>
                                                            <UnvoteButton text={text}/>
                                                        </div>
                                                        : <div/>}
                                                </div>
                                        }
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                        {text.status == 'published'
                            ? <VoteResult textId={text.id}/>
                            : <div/>}
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = Text;
