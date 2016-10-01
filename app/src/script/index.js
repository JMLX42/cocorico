require('../style/index.less');
require('babel-polyfill');

console.log('commit hash:', __COMMIT_HASH__);
console.log('build number:', __BUILD_NUMBER__);
console.log('build date:', __BUILD_DATE__);
console.log('env:', __ENV__);

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var Router = ReactRouter.Router,
  Route = ReactRouter.Route,
  IndexRoute = ReactRouter.IndexRoute,
  browserHistory = ReactRouter.browserHistory,

  App = require('./App'),
  Embed = require('./Embed'),
  Page = require('./page/Page'),
  Home = require('./page/Home'),
  Login = require('./page/Login'),
  ServiceStatus = require('./page/ServiceStatus'),
  VotePage = require('./page/VotePage'),
  EmbedVoteWidgetPage = require('./page/embed/VoteWidgetPage'),
  BallotBox = require('./page/BallotBox'),

  RouteAction = require('./action/RouteAction');

browserHistory.listen((location, action) => {
  RouteAction.change(browserHistory, location, action);
});

var messages = require('./intl/locale.js').getCurrentLocaleMessages();

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Home}/>
      <Route path={messages.route.SIGN_IN} component={Login}/>
      <Route path={messages.route.SERVICE_STATUS} component={ServiceStatus}/>
      <Route path="vote/:slug" component={VotePage}/>
      <Route path={messages.route.BALLOT_BOX + '/:voteId'} component={BallotBox}/>
    </Route>
    <Route path="/embed" component={Embed}>
      <Route path="vote-widget/:voteId" component={EmbedVoteWidgetPage}/>
    </Route>
    <Route path="/" component={App}>
      <Route path=":slug" component={Page}/>
    </Route>
  </Router>,
  document.getElementById('root')
);
