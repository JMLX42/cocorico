var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');
var $ = require('jquery');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var TextAction = require('../action/TextAction'),
    SourceAction = require('../action/SourceAction');

var SourceStore = require('../store/SourceStore');

var LikeButtons = require('./LikeButtons');

var Link = ReactRouter.Link;

var FormattedMessage = ReactIntl.FormattedMessage;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Input = ReactBootstrap.Input;

var SourceTab = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(SourceStore, 'sources')
    ],

    STEP_ADD: 'read',
    STEP_READ: 'add',

    getInitialState: function()
    {
        return {
            step: this.STEP_READ,
            newSourceURL: ''
        };
    },

    componentWillMount: function()
    {
        TextAction.showSources(this.props.text.id);
    },

    addSourceClickHandler: function(event)
    {
        this.setState({step: this.STEP_ADD});
    },

    submitSourceClickHandler: function(event)
    {
        TextAction.addSource(this.props.text.id, this.state.newSourceURL);
    },

    renderSourceList: function(sources)
    {
        return (
            <ul className="source-list">
                {sources.sort((a, b)=> b.score - a.score).map((source) => {
                    return <li className="source-item">
                        <a href={source.url} target="_blank">
                            {source.title ? source.title : source.url}
                        </a>
                        <LikeButtons likeAction={SourceAction.like}
                            resource={source}
                            likeButtonEnabled={this.props.editable}
                            dislikeButtonEnabled={this.props.editable}/>
                    </li>;
                })}
            </ul>
        );
    },

    render: function()
    {
        if (!this.state || !this.state.sources)
            return null;

        if (this.state.sources
            && this.state.sources.textSourceLoading(this.props.text.id))
            return (
                <Grid>
                    <Row>
                        <Col md={12}>
                            Chargement...
                        </Col>
                    </Row>
                </Grid>
            );

        var sources = this.state.sources.getSourcesByTextId(this.props.text.id);

        if (!sources)
            return null;

        var textSources = sources
            ? sources.filter((source) => source.auto)
            : null;
        var communitySources = sources
            ? sources.filter((source) => !source.auto)
            : null;

        var sourceError = this.state.sources.getError();

		return (
            <Grid>
                <Row>
                    <Col md={12}>
                        <h3>
                            {this.getIntlMessage('text.TEXT_SOURCES')}
                            &nbsp;({textSources ? textSources.length : 0})
                            <span className="small">
                                &nbsp;
                                <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                    gender="female"/>
                            </span>
                        </h3>
                        {textSources && textSources.length
                            ? this.renderSourceList(textSources)
                            : <p>{this.getIntlMessage('text.NO_SOURCE')}</p>}
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h3>
                            {this.getIntlMessage('text.COMMUNITY_SOURCES')}
                            &nbsp;({communitySources ? communitySources.length : 0})
                            <span className="small">
                                &nbsp;
                                <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                    gender="female"/>
                            </span>
                        </h3>
                        {communitySources && communitySources.length
                            ? this.renderSourceList(communitySources)
                            : <p>{this.getIntlMessage('text.NO_SOURCE')}</p>}
                    </Col>
                    {this.props.editable
                        ? <Col md={12}>
                            {!this.isAuthenticated()
                                ? <p className="hint">
                                    {this.renderLoginMessage(this.getIntlMessage('text.ADD_SOURCE_LOGIN'))}
                                </p>
                                : this.state.step == this.STEP_ADD
                                    ? <form id="form-add-source">
                                        <h4>{this.getIntlMessage('text.ADD_SOURCE_FORM_TITLE')}</h4>
                                        <p>{this.getIntlMessage('text.ADD_SOURCE_URL_HINT')}</p>
                                        <Input type="text" placeholder="http://www.exemple.com"
                                            id="input-source-url" value={this.state.newSourceURL}
                                            onChange={(e)=>this.setState({ newSourceURL: e.target.value })}/>
                                            {sourceError
                                                ? <p>{this.getIntlMessage(sourceError.error)}</p>
                                                : <div/>}
                                        <Button bsStyle="primary" onClick={this.submitSourceClickHandler}>
                                            {this.getIntlMessage('text.ADD_SOURCE_SUBMIT_BUTTON')}
                                        </Button>
                                    </form>
                                    : <Button bsStyle="primary" onClick={this.addSourceClickHandler}
                                          id="btn-add-source">
                                        {this.getIntlMessage('text.ADD_SOURCE_BUTTON')}
                                    </Button>}
                        </Col>
                        : <Col md={12}>
                            <p className="hint">
                                {this.getIntlMessage('text.TOO_LATE_TO_REVIEW')}
                            </p>
                        </Col>}
                </Row>
            </Grid>
		);
	}
});

module.exports = SourceTab;
