require('../style/index.less');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var Router = ReactRouter.Router,
    Route = ReactRouter.Route,
    IndexRoute = ReactRouter.IndexRoute,

    App = require('./App'),
    Page = require('./page/Page'),
    Login = require('./page/Login'),
    Home = require('./page/Home');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path='page/:slug' component={Page}/>
            <Route path='login' component={Login}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
