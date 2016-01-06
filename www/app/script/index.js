require('../style/index.less');

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
    Page = require('./page/Page'),
    ViewText = require('./page/ViewText'),
    CreateText = require('./page/CreateText'),
    EditText = require('./page/EditText'),
    DeleteText = require('./page/DeleteText'),
    Home = require('./page/Home'),
    Login = require('./page/Login'),
    MyTexts = require('./page/MyTexts');

ReactDOM.render(
    <Router history={History.createHistory()}>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path={messages.route.SIGN_IN + '/(:redirect)'} component={Login}/>
            <Route path={messages.route.MY_TEXTS} component={MyTexts}/>
            <Route path={messages.route.CREATE_TEXT} component={CreateText}/>
            <Route path={messages.route.EDIT_TEXT + '/:textId/:slug'} component={EditText}/>
            <Route path={messages.route.VIEW_TEXT + '/:textId/:slug(/:tab)'} component={ViewText}/>
            <Route path={messages.route.DELETE_TEXT + '/:textId/:slug'} component={DeleteText}/>
            <Route path='page/:slug' component={Page}/>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
