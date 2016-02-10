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
    ViewBill = require('./page/ViewBill'),
    CreateBill = require('./page/CreateBill'),
    EditBill = require('./page/EditBill'),
    DeleteBill = require('./page/DeleteBill'),
    Home = require('./page/Home'),
    Login = require('./page/Login'),
    MyBills = require('./page/MyBills'),
    ServiceStatus = require('./page/ServiceStatus');

ReactDOM.render(
    <Router history={History.createHistory()}>
        <Route path='/' component={App}>
            <IndexRoute component={Home}/>
            <Route path={messages.route.SIGN_IN + '/(:redirect)'} component={Login}/>
            <Route path={messages.route.MY_BILLS} component={MyBills}/>
            <Route path={messages.route.CREATE_BILL} component={CreateBill}/>
            <Route path={messages.route.EDIT_BILL + '/:billId/:slug'} component={EditBill}/>
            <Route path={messages.route.VIEW_BILL + '/:billId/:slug(/:tab)'} component={ViewBill}/>
            <Route path={messages.route.DELETE_BILL + '/:billId/:slug'} component={DeleteBill}/>
            <Route path={messages.route.SERVICE_STATUS} component={ServiceStatus}/>
            <Route path='page/:slug' component={Page}/>
            <Route path=':slug' component={Page}/>
        </Route>
    </Router>,
    document.getElementById('app')
);
