require('../style/index.less');
require('babel-polyfill');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');
var History = require('history');
var messages = require('./intl/intl').messages;

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
    EmbedVoteWidgetPage = require('./page/embed/VoteWidgetPage');

ReactDOM.render(
    <Router history={History.createHistory()}>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path={messages.route.SIGN_IN} component={Login}/>
            <Route path={messages.route.SERVICE_STATUS} component={ServiceStatus}/>
            <Route path='vote/:slug' component={VotePage}/>
        </Route>
        <Route path='/embed' component={Embed}>
            <Route path='vote-widget/:voteId' component={EmbedVoteWidgetPage}/>
        </Route>
        <Route path='/' component={App}>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
