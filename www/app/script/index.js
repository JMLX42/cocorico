require('../style/index.less');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var Router = ReactRouter.Router,
    Route = ReactRouter.Route,
    IndexRoute = ReactRouter.IndexRoute,

    App = require('./App'),
    Page = require('./page/Page'),
    Text = require('./page/Text'),
    CreateText = require('./page/CreateText'),
    Home = require('./page/Home');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path='text/create' component={CreateText}/>
            <Route path='text/:slug' component={Text}/>
            <Route path='page/:slug' component={Page}/>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
