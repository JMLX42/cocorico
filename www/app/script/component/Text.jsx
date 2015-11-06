var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var TextAction = require('../action/TextAction'),
    UserAction = require('../action/UserAction');

var VoteButtonBar = require('./VoteButtonBar'),
    LoginButton = require('./LoginButton'),
    UnvoteButton = require('./UnvoteButton');

var BallotStore = require('../store/BallotStore'),
    UserStore = require('../store/UserStore'),
    TextStore = require('../store/TextStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab;

var Text = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(TextStore, 'texts'),
        Reflux.connect(BallotStore, 'ballots'),
        Reflux.connect(UserStore, 'users')
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

    componentWillReceiveProps: function(props)
    {
        if (props.textId != this.props.textId)
            TextAction.show(props.textId);
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

		return (
            <ReactDocumentTitle title={text.title + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div className="text">
                    <Grid>
                        <Row className="section">
                            <Col md={12}>
                                <h1 className="text-title">{text.title}</h1>
                            </Col>
                        </Row>
                        <Row className="section">
                            <Col md={12}>
                                <div className="text-content">
                                    <Markdown source={text.content.md} />
                                </div>
                            </Col>
                        </Row>

                        {!!text && text.additionalData
                            ? <Row className="section">
                                <Col md={12}>
                                    <h2 className="section-title">{this.getIntlMessage('text.ADDITIONAL_DATA')}</h2>
                                    <Markdown source={text.additionalData} />
                                </Col>
                            </Row>
                            : <div/>}
                    </Grid>
                    <div className={this.state.ballots && ballot && !ballot.error && ballot.value ? 'voted-' + ballot.value : ''}>
                        <Grid>
                            <Row className="section">
                                <Col md={12}>
                                    <h2 className="section-title">{this.getIntlMessage('text.YOUR_VOTE')}</h2>
                                    {!!currentUser
                                        ? !!this.state.ballots && (!ballot || ballot.error == 404)
                                            ? <VoteButtonBar textId={text.id}/>
                                            : <div>
                                                <FormattedMessage message={this.getIntlMessage('text.ALREADY_VOTED')}
                                                                  value={ballot ? this.getIntlMessage('text.VOTE_' + ballot.value.toUpperCase()) : ''}
                                                                  date={<FormattedTime value={ballot ? ballot.time : Date.now()}/>}/>
                                                <br/>
                                                <UnvoteButton text={text}/>
                                             </div>
                                        : <div>
                                            {this.getIntlMessage('text.LOGIN_REQUIRED')} <LoginButton />
                                         </div>}
                                </Col>
                            </Row>
                        </Grid>
                    </div>
                    <div>
                        <Grid>
                            <Row className="section">
                                <Col md={12}>
                                    <h2 className="section-title">{this.getIntlMessage('text.PARTICIPATIONS')}</h2>
                                    <Tabs defaultActiveKey={1}>
                                        <Tab eventKey={1} title="Propositions"/>
                                        <Tab eventKey={2} title="Arguments"/>
                                        <Tab eventKey={3} title="Sources"/>
                                    </Tabs>
                                </Col>
                            </Row>
                        </Grid>
                    </div>
                </div>
            </ReactDocumentTitle>
		);
	}
});

module.exports = Text;
