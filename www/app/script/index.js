require('../style/index.less');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var Router = ReactRouter.Router,
    Route = ReactRouter.Route,

    App = require('./App');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
        </Route>
    </Router>,
    document.getElementById('app')
);
