var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');
var $ = require('jquery');

var ForceAuthMixin = require('../mixin/ForceAuthMixin'),
    ProxyMixin = require('../mixin/ProxyMixin');

var BillAction = require('../action/BillAction'),
    SourceAction = require('../action/SourceAction');

var SourceStore = require('../store/SourceStore'),
    ConfigStore = require('../store/ConfigStore');

var LikeButtons = require('./LikeButtons'),
    LoadingIndicator = require('./LoadingIndicator'),
    RedirectLink = require('./RedirectLink');

var Link = ReactRouter.Link;

var FormattedMessage = ReactIntl.FormattedMessage;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Input = ReactBootstrap.Input,
    Well = ReactBootstrap.Well,
    ButtonToolbar = ReactBootstrap.ButtonToolbar;

var SourceTab = React.createClass({

    mixins: [
        ForceAuthMixin,
        ProxyMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(SourceStore, 'sources'),
        Reflux.connect(ConfigStore, 'config')
    ],

    getInitialState: function() {
        return {
            showAddSourceForm: false,
            newSourceURL: ''
        };
    },

    componentWillMount: function() {
        BillAction.showSources(this.props.bill.id);
    },

    addSourceButtonClickHandler: function(event) {
        this.setState({
            showAddSourceForm: true,
            newSourceURL: ''
        });
    },

    submitSourceClickHandler: function(event) {
        BillAction.addSource(this.props.bill.id, this.state.newSourceURL);
        this.setState({showAddSourceForm: false});
    },

    renderSourceList: function(sources) {
        return (
            <ul className="source-list">
                {sources.sort((a, b)=> b.score - a.score).map((source) => {
                    var description = source.description.length > 200
                        ? source.description.substr(0, 200) + '...'
                        : source.description;

                    return <li className="source-item" key={source.url}>
                        <Row>
                            <Col md={2}>
                                <RedirectLink href={source.url} target="_blank">
                                    <div style={{backgroundImage: "url('" + this.proxifyURL(source.image) + "')"}}
                                        className="source-image text-center">
                                            {source.type == 'video'
                                            ? <i className="icon-play"/>
                                            : null}
                                    </div>
                                </RedirectLink>
                            </Col>
                            <Col md={10}>
                                <RedirectLink href={source.url} className="source-link" target="_blank">
                                    {source.title ? source.title : source.url}
                                </RedirectLink>
                                <LikeButtons likeAction={SourceAction.like}
                                    resource={source}
                                    likeButtonEnabled={this.props.editable}
                                    dislikeButtonEnabled={this.props.editable}/>
                                <span className="pull-right">
                                    {source.type == 'activity' && source.latitude != 0.0 && source.longitude != 0.0
                                        ? <RedirectLink target="_blank" className="small"
                                            href={'https://maps.google.com/?q=' + source.latitude + ',' + source.longitude}>
                                            <i className="icon-map"/>&nbsp;Voir sur la carte
                                        </RedirectLink>
                                        : null}
                                </span>
                                <p>
                                    {description}
                                </p>
                            </Col>
                        </Row>
                    </li>;
                })}
            </ul>
        );
    },

    renderBillSourceList: function(billSources) {
        return (
            <Row>
                <Col md={12}>
                    <h2>
                        {this.getIntlMessage('bill.BILL_SOURCES')}
                        &nbsp;({billSources ? billSources.length : 0})
                        <span className="small">
                            &nbsp;
                            <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                gender="female"/>
                        </span>
                    </h2>
                    {billSources && billSources.length
                        ? this.renderSourceList(billSources)
                        : <p>{this.getIntlMessage('bill.NO_SOURCE')}</p>}
                </Col>
            </Row>
        )
    },

    renderCommunitySourceList: function(communitySources) {
        return (
            <Row>
                <Col md={12}>
                    <h2>
                        {this.getIntlMessage('bill.COMMUNITY_SOURCES')}
                        &nbsp;({communitySources ? communitySources.length : 0})
                        <span className="small">
                            &nbsp;
                            <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                gender="female"/>
                        </span>
                    </h2>
                    {communitySources && communitySources.length
                        ? this.renderSourceList(communitySources)
                        : <p>{this.getIntlMessage('bill.NO_SOURCE')}</p>}
                </Col>
                {this.props.editable
                    ? this.renderAddSourceForm()
                    : <Col md={12}>
                        <p className="hint">
                            {this.getIntlMessage('bill.TOO_LATE_TO_REVIEW')}
                        </p>
                    </Col>}
            </Row>
        );
    },

    renderAddSourceForm: function() {
        var sourceError = this.state.sources.getError();

        return (
            <Col md={12}>
                {!this.isAuthenticated()
                    ? <p className="hint">
                        {this.renderLoginMessage(this.getIntlMessage('bill.ADD_SOURCE_LOGIN'))}
                    </p>
                    : this.state.showAddSourceForm
                        ? <Well>
                            <form id="form-add-source">
                                <h3>{this.getIntlMessage('bill.ADD_SOURCE_FORM_TITLE')}</h3>
                                <p>{this.getIntlMessage('bill.ADD_SOURCE_URL_HINT')}</p>
                                <Input type="bill" placeholder="http://www.exemple.com"
                                    id="input-source-url" value={this.state.newSourceURL}
                                    onChange={(e)=>this.setState({newSourceURL: e.target.value})}/>
                                    {sourceError
                                        ? <p>{this.getIntlMessage(sourceError.error)}</p>
                                        : <div/>}
                                <ButtonToolbar>
                                    <Button bsStyle="primary" onClick={this.submitSourceClickHandler}>
                                        <i className="icon-add_circle_outline"/>
                                        {this.getIntlMessage('bill.ADD_SOURCE_SUBMIT_BUTTON')}
                                    </Button>
                                    <Button bsStyle="link"
                                        onClick={(e) => this.setState({showAddSourceForm:false})}>
                                        {this.getIntlMessage('bill.ADD_SOURCE_CANCEL_BUTTON')}
                                    </Button>
                                </ButtonToolbar>
                            </form>
                        </Well>
                        : <Button bsStyle="primary" onClick={this.addSourceButtonClickHandler}
                              id="btn-add-source">
                            <i className="icon-add_circle_outline"/>
                            {this.getIntlMessage('bill.ADD_SOURCE_BUTTON')}
                        </Button>}
            </Col>
        );
    },

    render: function() {
        if (!this.state || !this.state.sources)
            return null;

        if (this.state.sources
            && this.state.sources.billSourceLoading(this.props.bill.id))
            return (
                <Grid>
                    <Row>
                        <Col md={12}>
                            <LoadingIndicator/>
                        </Col>
                    </Row>
                </Grid>
            );

        var sources = this.state.sources.getSourcesByBillId(this.props.bill.id);

        if (!sources)
            return null;

        var billSources = sources
            ? sources.filter((source) => source.auto)
            : null;
        var communitySources = sources
            ? sources.filter((source) => !source.auto)
            : null;

        return (
            <Grid>
                {this.state.config.capabilities.source.bill
                    ? this.renderBillSourceList(billSources)
                    : null}
                {this.state.config.capabilities.source.community
                    ? this.renderCommunitySourceList(communitySources)
                    : null}
            </Grid>
		);
	}
});

module.exports = SourceTab;
