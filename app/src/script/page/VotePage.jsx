var React = require('react');
var Reflux = require('reflux');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactDocumentTitle = require('react-document-title');
var jquery = require('jquery');

var PropTypes = React.PropTypes;

var StringHelper = require('../helper/StringHelper');

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var Icon = require('../component/Icon'),
    RedirectLink = require('../component/RedirectLink'),
    SourceTab = require('../component/SourceTab'),
    Icon = require('../component/Icon'),
    VoteWidget = require('../component/VoteWidget');

var ProxyMixin = require('../mixin/ProxyMixin');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var VotePage = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        ProxyMixin,
        Reflux.connect(VoteStore, 'votes')
    ],

    componentWillUnmount: function() {
    },

    componentWillMount: function() {
        VoteAction.showPage(this.props.params.slug);
    },

    getInitialState: function() {
        return {
            showVoteWidget: false
        };
    },

    render: function() {
        var vote = this.state.votes.getBySlug(this.props.params.slug);

        if (!vote) {
            return null;
        }

        return (
            <ReactDocumentTitle title={StringHelper.toTitleCase(vote.title) + ' - ' + this.getIntlMessage('site.TITLE')}>
                <div>
                    {this.state.showVoteWidget
                        ? <VoteWidget vote={vote}/>
                        : null}
                    <div className="vote-banner">
                        <div className="vote-banner-img"
                            style={{backgroundImage: 'url(' + this.proxifyURL(vote.image) + ')'}}/>
                        <div className="vote-banner-overlay"/>
                    </div>
                    <Grid >
                        <Row>
                            <Col xs={12}>
                                <h1>
                                    {vote.title}
                                </h1>
                                <small>
                                    <RedirectLink href={vote.url}>
                                        {vote.url}
                                    </RedirectLink>
                                </small>
                                <p>
                                    {vote.description}
                                    {vote.description[-1] != '.' ? '...' : null}
                                    &nbsp;
                                    <RedirectLink href={vote.url}>
                                        Lire la suite
                                    </RedirectLink>
                                </p>
                            </Col>
                        </Row>
                    </Grid>
                    <SourceTab vote={vote}/>
                    <Grid>
                        <Row>
                            <Col xs={12}>
                                <h2>
                                    <Icon name="megaphone"/>
                                    Militer
                                </h2>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <h2>
                                    <Icon name="enveloppe"/>
                                    Voter
                                </h2>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Button
                                    bsSize="large"
                                    bsStyle="primary"
                                    onClick={(e)=>this.setState({showVoteWidget:true})}>
                                    Voter
                                </Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <h2>
                                    <Icon name="share"/>
                                    Partager
                                </h2>
                            </Col>
                        </Row>
                    </Grid>
                </div>
            </ReactDocumentTitle>
        );
    }

});

module.exports = VotePage;
