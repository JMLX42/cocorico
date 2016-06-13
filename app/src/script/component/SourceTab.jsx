var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

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
        Reflux.ListenerMixin,
        Reflux.connect(SourceStore, 'sources'),
        Reflux.connect(ConfigStore, 'config')
    ],

    getInitialState: function() {
        return {
            showAddSourceForm: false,
            newSourceURL: '',
            moderatedSourcesToShow: [],
            communitySourceSortFunctionName: 'random',
            communitySourceSortFunction: this.randomSort,
            communitySources: [],
            communitySourcePage: 0
        };
    },

    componentWillMount: function() {
        BillAction.showSources(this.props.bill.id);

        this._unsubSourceStore = SourceStore.listen((store) => {
            if (!this.state.sources)
                return;

            var sources = this.state.sources.getSourcesByBillId(this.props.bill.id);
            var communitySources = sources
                ? sources.filter((source) => !source.auto)
                : null;

            if (communitySources.length != this.state.communitySources.length
                || this.state.communitySourceSortFunctionName == 'score')
                this.setState({
                    communitySources: communitySources.sort(this.state.communitySourceSortFunction)
                });

            var moderatedSources = this.state.moderatedSourcesToShow;

            for (var source of sources) {
                if (source.score >= 0  && moderatedSources.indexOf(source.id) >= 0) {
                    moderatedSources.splice(moderatedSources.indexOf(source.id), 1);
                    this.setState({moderatedSourcesToShow: moderatedSources});
                }
            }
        });
    },

    componentWillUnmount: function() {
        this._unsubSourceStore();
    },

    addSourceButtonClickHandler: function(event) {
        this.setState({
            showAddSourceForm: true,
            newSourceURL: ''
        });
    },

    submitSourceClickHandler: function(event) {
        BillAction.addSource(this.props.bill.id, this.state.newSourceURL);
        this.setState({
            showAddSourceForm: false,
            communitySourcePage: 0
        });
        this.setCommunitySourceSortFunctionByName('time');
    },

    showModeratedSource: function(source) {
        var sources = this.state.moderatedSourcesToShow;

        sources.push(source.id);
        this.setState({moderatedSourcesToShow: sources});
    },

    hideModeratedSource: function(source) {
        var sources = this.state.moderatedSourcesToShow;

        sources.splice(sources.indexOf(source.id), 1);
        this.setState({moderatedSourcesToShow: sources});
    },

    renderModeratedSourceItem: function(source) {
        return (
            <li className="source-item source-item-moderated" key={source.url}>
                <Row>
                    <Col md={12}>
                        <span className="hint">Contenu modéré</span>
                        <p className="hint">
                            Ce contenu a reçu trop d'avis négatifs de la communauté.&nbsp;
                            <a onClick={(e) => this.showModeratedSource(source)}>
                                Cliquez ici pour l'afficher.
                            </a>
                        </p>
                    </Col>
                </Row>
            </li>
        );
    },

    renderSourceActionList: function(source) {
        return (
            <ul className="source-actions list-unstyled list-inline">
                <li>
                    <a href="#" className="btn btn-xs btn-outline">
                        <i className="icon-flag"/>Signaler
                    </a>
                </li>
                {source.type == 'activity' && source.latitude != 0.0 && source.longitude != 0.0
                    ? <li>
                        <RedirectLink target="_blank" className="btn btn-xs btn-outline"
                            href={'https://maps.google.com/?q=' + source.latitude + ',' + source.longitude}>
                            <i className="icon-map"/>&nbsp;Voir sur une carte
                        </RedirectLink>
                    </li>
                    : null}
                {this.state.moderatedSourcesToShow.indexOf(source.id) >= 0
                    ? <li>
                        <a onClick={(e) => this.hideModeratedSource(source)}
                            className="btn btn-xs btn-outline">
                            <i className="icon-eye-blocked"/>&nbsp;Masquer
                        </a>
                    </li>
                    : null}
            </ul>
        );
    },

    renderSourceItem: function(source) {
        var description = source.description && source.description.length > 200
            ? source.description.substr(0, 200) + '...'
            : source.description;

        return (
            <li className="source-item" key={source.url}>
                <Row>
                    {!!source.image
                        ? <Col md={2} mdPush={10}>
                            <RedirectLink href={source.url} target="_blank">
                                <div style={{
                                        backgroundImage: "url('" + this.proxifyURL(source.image) + "')"
                                    }}
                                    className="source-image text-center">
                                        {source.type == 'video'
                                            ? <i className="icon-play"/>
                                            : null}
                                </div>
                            </RedirectLink>
                        </Col>
                        : null}
                    <Col md={10} mdPull={!!source.image ? 2 : 0}>
                        <RedirectLink href={source.url} className="source-link" target="_blank">
                            {source.title ? source.title : source.url}
                        </RedirectLink>
                        <LikeButtons likeAction={SourceAction.like}
                            resource={source}
                            likeButtonEnabled={this.props.editable}
                            dislikeButtonEnabled={this.props.editable}/>
                        {this.renderSourceActionList(source)}
                        <p>
                            {!!description
                                ? '"' + description + '"'
                                : <span className="hint">Pas de description.</span>}
                        </p>
                    </Col>
                </Row>
            </li>
        )
    },

    renderSourceList: function(sources, page, numItemsPerPage) {
        return (
            <ul className="source-list">
                {sources.slice(page * numItemsPerPage, (page + 1) * numItemsPerPage).map((source) => {
                    return source.score >= 0 || this.state.moderatedSourcesToShow.indexOf(source.id) >= 0
                        ? this.renderSourceItem(source)
                        : this.renderModeratedSourceItem(source);
                })}
            </ul>
        );
    },

    renderSourcePageList: function(numSources, page, numItemsPerPage, state) {
        if (numSources < numItemsPerPage)
            return null;

        var pages = [];

        for (var i = 0; i < numSources; i += numItemsPerPage)
            pages.push(Math.floor(i / numItemsPerPage));

        return (
            <ul className="list-inline list-unstyled pull-right">
                <li>Pages :</li>
                {page != 0 && pages.length > 2
                    ? <li>
                        <a onClick={(e)=>this.setState({[state] : page - 1})}>
                            &lsaquo;
                        </a>
                    </li>
                    : null}
                {pages.map((pageNumber) => {
                    return (
                        <li>
                            {pageNumber != page
                                ? <a onClick={(e)=>this.setState({[state] : pageNumber})}>
                                    {pageNumber + 1}
                                </a>
                                : pageNumber + 1}
                        </li>
                    );
                })}
                {page < pages.length - 1 && pages.length > 2
                    ? <li>
                        <a onClick={(e)=>this.setState({[state] : page + 1})}>
                            &rsaquo;
                        </a>
                    </li>
                    : null}
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
                    </h2>
                    {billSources && billSources.length
                        ? this.renderSourceList(billSources, 0, 2)
                        : <p>{this.getIntlMessage('bill.NO_SOURCE')}</p>}
                </Col>
            </Row>
        )
    },

    randomSort: function(a, b) {
        return Math.floor((Math.random() * 10000)) % 2 == 0;
    },

    scoreSort: function(a, b) {
        return a.score <= b.score;
    },

    dateSort: function(a, b) {
        return new Date(b.time) - new Date(a.time);
    },

    setCommunitySourceSortFunctionByName: function(name) {
        var fns = {
            'random': this.randomSort,
            'score': this.scoreSort,
            'time': this.dateSort
        };
        var fn = fns[name];

        this.setState({
            communitySourceSortFunctionName: name,
            communitySourceSortFunction: fn,
            communitySources: this.state.communitySources.sort(fn)
        });
    },

    renderCommunitySourceList: function() {
        return (
            <div>
                <Row>
                    <Col md={12}>
                        <h2>
                            {this.getIntlMessage('bill.COMMUNITY_SOURCES')}
                            &nbsp;({this.state.communitySources ? this.state.communitySources.length : 0})
                            <select onChange={(e) => this.setCommunitySourceSortFunctionByName(e.target.value)}
                                className="small sort-function"
                                value={this.state.communitySourceSortFunctionName}>
                                <option value="random">
                                    {this.formatMessage(this.getIntlMessage('sort.SORTED_RANDOMLY'), {gender:'female'})}
                                </option>
                                <option value="score">
                                    {this.formatMessage(this.getIntlMessage('sort.SORTED_BY_POPULARITY'), {gender:'female'})}
                                </option>
                                <option value="time">
                                    {this.formatMessage(this.getIntlMessage('sort.SORTED_BY_TIME'), {gender:'female'})}
                                </option>
                            </select>
                        </h2>
                        {this.state.communitySources && this.state.communitySources.length
                            ? this.renderSourceList(
                                this.state.communitySources,
                                this.state.communitySourcePage,
                                this.state.config.capabilities.source.num_items_per_page
                            )
                            : <p>{this.getIntlMessage('bill.NO_SOURCE')}</p>}
                    </Col>
                </Row>
                <Row>
                    <Col sm={6}>
                        {this.props.editable
                            ? this.renderAddSourceForm()
                            : <p className="hint">
                                    {this.getIntlMessage('bill.TOO_LATE_TO_REVIEW')}
                            </p>}
                    </Col>
                    <Col sm={6}>
                        {this.renderSourcePageList(
                            this.state.communitySources.length,
                            this.state.communitySourcePage,
                            this.state.config.capabilities.source.num_items_per_page,
                            'communitySourcePage'
                        )}
                    </Col>
                </Row>
            </div>
        );
    },

    renderAddSourceForm: function() {
        var sourceError = this.state.sources.getError();

        return (
            !this.isAuthenticated()
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
                    </Button>
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

        return (
            <Grid>
                {this.state.config.capabilities.source.bill
                    ? this.renderBillSourceList(billSources)
                    : null}
                {this.state.config.capabilities.source.community
                    ? this.renderCommunitySourceList()
                    : null}
            </Grid>
		);
	}
});

module.exports = SourceTab;
