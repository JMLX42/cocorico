var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin'),
  ProxyMixin = require('../mixin/ProxyMixin');

var SourceAction = require('../action/SourceAction');

var SourceStore = require('../store/SourceStore'),
  ConfigStore = require('../store/ConfigStore');

var LikeButtons = require('./LikeButtons'),
  LoadingIndicator = require('./LoadingIndicator'),
  RedirectLink = require('./RedirectLink'),
  Icon = require('./Icon');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col;

var SourceTab = React.createClass({

  mixins: [
    ForceAuthMixin,
    ProxyMixin,
    ReactIntl.IntlMixin,
    Reflux.ListenerMixin,
    Reflux.connect(SourceStore, 'sources'),
    Reflux.connect(ConfigStore, 'config'),
  ],

  getInitialState: function() {
    return {
      sourceList: [],
      moderatedSourcesToShow: [],
      sortFunctionName: 'random',
      sortFunction: this.randomSort,
      page: 0,
    };
  },

  componentWillMount: function() {
    SourceAction.show(this.props.vote.id);

    this._unsubSourceStore = SourceStore.listen((store) => {
      var sources = store.getSourcesByVoteId(this.props.vote.id);

      if (!sources) {
        return;
      }

      if (sources.length !== this.state.sourceList.length
          || this.state.sortFunctionName === 'score')
        this.setState({
          sourceList: sources.sort(this.state.sortFunction),
        });

      var moderatedSources = this.state.moderatedSourcesToShow;

      for (var source of sources) {
        if (source.score >= 0 && moderatedSources.indexOf(source.id) >= 0) {
          moderatedSources.splice(moderatedSources.indexOf(source.id), 1);
          this.setState({moderatedSourcesToShow: moderatedSources});
        }
      }
    });
  },

  componentWillUnmount: function() {
    this._unsubSourceStore();
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
        {source.type === 'activity' && source.latitude !== 0.0 && source.longitude !== 0.0
          ? <li>
            <RedirectLink className="btn btn-xs btn-outline"
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
    var hasImage = !!source.image;
    var imageUrl = hasImage && source.image.indexOf('http') === 0
      ? this.proxifyURL(source.image)
      : '/img/screenshot/' + source.image;

    return (
      <li className="source-item" key={source.url}>
        <Row>
          <Col md={2}>
            {hasImage
              ? <RedirectLink href={source.url}>
                <div style={{
                  backgroundImage: "url('" + imageUrl + "')",
                }}
                  className="source-image text-center">
                    {source.type === 'video'
                      ? <i className="icon-play"/>
                      : null}
                </div>
              </RedirectLink>
              : null}
          </Col>
          <Col md={10}>
            <RedirectLink href={source.url} className="source-link">
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
    );
  },

  renderSourceList: function() {
    var sources = this.state.sourceList;
    var page = this.state.page;
    var numItemsPerPage = this.state.config.capabilities.source
            .num_items_per_page;

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

  renderSourcePageList: function() {
    var page = this.state.page;
    var numSources = this.state.sourceList.length;
    var numItemsPerPage = this.state.config.capabilities.source
      .num_items_per_page;

    if (!this.state.sourceList || numSources < numItemsPerPage) {
      return null;
    }

    var pages = [];
    for (var i = 0; i < numSources; i += numItemsPerPage)
      pages.push(Math.floor(i / numItemsPerPage));

    return (
      <Row>
        <Col md={12}>
          <ul className="list-inline list-unstyled pull-right">
            <li>Pages :</li>
            {page !== 0 && pages.length > 2
              ? <li>
                <a onClick={(e)=>this.setState({'page' : page - 1})}>
                  &lsaquo;
                </a>
              </li>
              : null}
            {pages.map((pageNumber) => {
              return (
                <li>
                  {pageNumber !== page
                    ? <a onClick={(e)=>this.setState({'page' : pageNumber})}>
                      {pageNumber + 1}
                    </a>
                    : pageNumber + 1}
                </li>
              );
            })}
            {page < pages.length - 1 && pages.length > 2
              ? <li>
                <a onClick={(e)=>this.setState({'page' : page + 1})}>
                  &rsaquo;
                </a>
              </li>
              : null}
          </ul>
        </Col>
      </Row>
    );
  },

  randomSort: function(a, b) {
    return Math.floor((Math.random() * 10000)) % 2 === 0;
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
      'time': this.dateSort,
    };
    var fn = fns[name];

    this.setState({
      sortFunctionName: name,
      sortFunction: fn,
      sourceList: this.state.sourceList.sort(fn),
    });
  },

  renderSources: function() {
    return (
      <div>
        <Row>
          <Col md={12}>
            {!!this.state.sourceList && !!this.state.sourceList.length
              ? this.renderSourceList()
              : <p>{this.getIntlMessage('vote.NO_SOURCE')}</p>}
          </Col>
        </Row>
        {!!this.state.sourceList && !!this.state.sourceList.length
          ? <Row>
            <Col md={12}>
              {this.renderSourcePageList()}
            </Col>
          </Row>
          : null}
      </div>
    );
  },

  render: function() {
    if (!this.state || !this.state.sources) {
      return null;
    }

    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <h2>
              <Icon name="pull-request"/>
              {this.getIntlMessage('vote.SOURCES')}
              &nbsp;({!!this.state.sourceList ? this.state.sourceList.length : 0})
              {!!this.state.sourceList && this.state.sourceList.length > 1
                ? <select
                  onChange={(e) => this.setCommunitySourceSortFunctionByName(e.target.value)}
                  className="small sort-function"
                  value={this.state.sortFunctionName}>
                  <option value="random">
                    {this.formatMessage(
                      this.getIntlMessage('sort.SORTED_RANDOMLY'),
                      {gender:'female'}
                    )}
                  </option>
                  <option value="score">
                    {this.formatMessage(
                      this.getIntlMessage('sort.SORTED_BY_POPULARITY'),
                      {gender:'female'}
                    )}
                  </option>
                  <option value="time">
                    {this.formatMessage(
                      this.getIntlMessage('sort.SORTED_BY_TIME'),
                      {gender:'female'}
                    )}
                  </option>
                </select>
                : null}
            </h2>
          </Col>
        </Row>
        {this.state.sources.voteSourceLoading(this.props.vote.id)
          ? <LoadingIndicator/>
          : this.renderSources()}
      </Grid>
		);
  },
});

module.exports = SourceTab;
