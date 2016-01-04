var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextAction = require('../action/TextAction'),
    UserAction = require('../action/UserAction');

var VoteButtonBar = require('./VoteButtonBar'),
    LoginButton = require('./LoginButton'),
    UnvoteButton = require('./UnvoteButton'),
    TableOfContents = require('./TableOfContents'),
    ArgumentEditor = require('./ArgumentEditor'),
    ArgumentTab = require('./ArgumentTab'),
    ContributionTabs = require('./ContributionTabs'),
    LikeButtons = require('./LikeButtons'),
    Hint = require('./Hint');

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
        UserAction.requireLogin();

        this.listenTo(TextAction.vote, (textId) => {
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
            <ReactDocumentTitle title={text.title + ' - ' + this.getIntlMessage('site.TITLE')}>
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
                        ? <div className="section section-notice-review cocorico-light-grey-background">
                            <Grid>
                                <Row>
                                    <Col md={12}>
                                        <h3>Ce texte est en cours de révision</h3>
                                        <p>
                                            Le texte ci-dessus n'est pas définitif et
                                            la communauté compte sur vos contributions.
                                            Vous pouvez contribuer ci-dessous en ajoutant
                                            des sources d'information complémentaires au
                                            texte ou en proposant des modifications sur
                                            le texte lui-même.
                                        </p>
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}

                    {text.status == 'debate'
                        ? <Hint pageSlug="astuce-etape-debat" className="section section-hint cocorico-light-grey-background"/>
                        : <div/>}

                    {text
                        ? <ContributionTabs text={text} editable={true} tab={this.props.tab}/>
                        : <div/>}

                    {text.status == 'vote'
                        ? <div className={this.state.ballots && ballot && !ballot.error && ballot.value ? 'voted-' + ballot.value : ''}>
                            <Grid>
                                <Row className="section">
                                    <Col md={12}>
                                        <h2 className="section-title">{this.getIntlMessage('text.YOUR_VOTE')}</h2>
                                        {!!currentUser
                                            ? !!this.state.ballots && (!ballot || ballot.error == 404)
                                                ? <div>
                                                    <VoteButtonBar textId={text.id}/>
                                                </div>
                                                : <div>
                                                    <FormattedMessage message={this.getIntlMessage('text.ALREADY_VOTED')}
                                                                      value={ballot && ballot.value ? this.getIntlMessage('text.VOTE_' + ballot.value.toUpperCase()) : ''}
                                                                      date={<FormattedTime value={ballot && ballot.time ? ballot.time : Date.now()}/>}/>
                                                    <br/>
                                                    <UnvoteButton text={text}/>
                                                 </div>
                                            : <div>
                                                <p className="hint">
                                                    {this.getIntlMessage('text.LOGIN_REQUIRED')} <LoginButton />
                                                </p>
                                             </div>}
                                    </Col>
                                </Row>
                            </Grid>
                        </div>
                        : <div/>}
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = Text;
