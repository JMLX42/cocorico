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
    ViewText = require('./page/ViewText'),
    CreateText = require('./page/CreateText'),
    EditText = require('./page/EditText'),
    Home = require('./page/Home'),
    MyTexts = require('./page/MyTexts');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path={messages.route.MY_TEXTS} component={MyTexts}/>
            <Route path={messages.route.CREATE_TEXT} component={CreateText}/>
            <Route path={messages.route.EDIT_TEXT + '/:slug'} component={EditText}/>
            <Route path={messages.route.VIEW_TEXT + '/:slug'} component={ViewText}/>
            <Route path='page/:slug' component={Page}/>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
