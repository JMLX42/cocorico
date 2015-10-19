require('../style/index.less');

var React = require('react');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var Router = ReactRouter.Router,
    Route = ReactRouter.Route,

    App = require('./App'),
    Page = require('./page/Page');

ReactDOM.render(
    <Router>
        <Route path='/' component={App}>
            <Route path='page/:slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
