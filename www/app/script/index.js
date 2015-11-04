require('../style/index.less');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');
var messages = require('./intl/intl').messages;

var Router = ReactRouter.Router,
    Route = ReactRouter.Route,
    IndexRoute = ReactRouter.IndexRoute,

    App = require('./App'),
    Page = require('./page/Page'),
    Text = require('./page/Text'),
    CreateText = require('./page/CreateText'),
    Home = require('./page/Home'),
    MyTexts = require('./page/MyTexts');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path={messages.route.MY_TEXTS} component={MyTexts}/>
            <Route path={messages.route.CREATE_TEXT} component={CreateText}/>
            <Route path={messages.route.TEXT + '/:slug'} component={Text}/>
            <Route path='page/:slug' component={Page}/>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
