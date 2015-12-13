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

    handleNewSourceURLChange: function(event)
    {
        this.setState({ newSourceURL: event.target.value });
    },

    submitSourceClickHandler: function(event)
    {
        TextAction.addSource(this.props.text.id, this.state.newSourceURL);
    },

    handleLikeClick: function(event, sourceId)
    {
        var source = this.state.sources.getSourceById(sourceId);

        if (source.likes && source.likes.length)
        {
            SourceAction.removeLike(sourceId);
            // FIXME: if like value is different, re-like with new value
            if (!source.likes[0].value)
                SourceAction.like(sourceId, true);
        }
        else
            SourceAction.like(sourceId, true);
    },

    handleDislikeClick: function(event, sourceId)
    {
        var source = this.state.sources.getSourceById(sourceId);

        if (source.likes && source.likes.length)
        {
            SourceAction.removeLike(sourceId);
            if (source.likes[0].value)
                SourceAction.like(sourceId, false);
        }
        else
            SourceAction.like(sourceId, false);
    },

    getLikeIconClassNames: function(value, source)
    {
        if (value)
            return 'icon-thumb_up icon-btn'
                + (source.likes.length && source.likes[0].value
                    ? ' icon-btn-active'
                    : '');

        return 'icon-thumb_down icon-btn'
            + (source.likes.length && !source.likes[0].value
                ? ' icon-btn-active'
                : '')
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
                        {this.isAuthenticated()
                            ? <span>
                                <span className={this.getLikeIconClassNames(true, source)}
                                      onClick={(e)=>this.handleLikeClick(e, source.id)}></span>
                                  <span className={this.getLikeIconClassNames(false, source)}
                                      onClick={(e)=>this.handleDislikeClick(e, source.id)}></span>
                            </span>
                            : <span/>}
                        <span className="source-score">({source.score})</span>
                    </li>;
                })}
            </ul>
        );
    },

    render: function()
    {
        if (!this.state || !this.state.sources)
            return null;

        var sources = this.state.sources.getSourcesByTextId(this.props.text.id);
        var textSources = sources
            ? sources.filter((source) => !source.author)
            : null;
        var communitySources = sources
            ? sources.filter((source) => !!source.author)
            : null;

        var sourceError = this.state.sources.getError();

		return (
            <Grid>
                <Row>
                    <Col md={12}>
                        <h3>
                            {this.getIntlMessage('text.TEXT_SOURCES')}
                            <span className="small"> triées par popularité</span>
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
                            <span className="small"> triées par popularité</span>
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
                                               onChange={this.handleNewSourceURLChange}/>
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
                        : <div/>}
                </Row>
            </Grid>
		);
	}
});

module.exports = SourceTab;
