require('../style/index.less');
require('babel-polyfill');

var config = require('/opt/cocorico/app-web/config.json');

var Raven = require('raven-js');
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

var messages = require('./intl/locale.js').getCurrentLocaleMessages();

function main() {
  // window.Intl polyfill
  // https://github.com/andyearnshaw/Intl.js/issues/118#issuecomment-120123392
  if (!window.Intl) {
    require.ensure(['intl'], (require) => {
      window.Intl = require('intl');
      run();
    }, 'IntlPolyfillBundle');
  } else {
    run();
  }
}

function run() {
  browserHistory.listen((location, action) => {
    RouteAction.change(browserHistory, location, action);
  });

  return ReactDOM.render(
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
}

console.log('commit hash:', __COMMIT_HASH__);
console.log('build number:', __BUILD_NUMBER__);
console.log('build date:', __BUILD_DATE__);
console.log('env:', __ENV__);

if (!!Raven) {
  Raven
    .config('https://' + config.sentry.public_key + '@sentry.io/' + config.sentry.project_id)
    .install();
  Raven.context(
    {
      release: __BUILD_NUMBER__,
      environment: __ENV__,
      tags: {
        commit: __COMMIT_HASH__,
      },
    },
    main
  );
} else {
  main();
}
