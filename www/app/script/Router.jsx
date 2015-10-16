var Routes = ReactRouter.Routes,
    Route = ReactRouter.Route,
    NotFoundRoute = ReactRouter.NotFoundRoute,
    DefaultRoute = ReactRouter.DefaultRoute,
    Redirect = ReactRouter.Redirect,

    App = require('./App');

var routes = (
    <Route path='/' handler={App}>
        <DefaultRoute handler={App} />
    </Route>
);

module.exports = routes;
