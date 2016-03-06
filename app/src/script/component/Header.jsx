var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactRouter = require('react-router');

var PageStore = require('../store/PageStore'),
    UserStore = require('../store/UserStore'),
    ConfigStore = require('../store/ConfigStore');

var PageAction = require('../action/PageAction'),
    UserAction = require('../action/UserAction');

var LoginButton = require('./LoginButton'),
    AccountDropdown = require('./AccountDropdown');

var Navbar = ReactBootstrap.Navbar,
    Collapse = Navbar.Collapse,
    Nav = ReactBootstrap.Nav,
    NavItem = ReactBootstrap.NavItem,
    NavbarBrand = ReactBootstrap.NavbarBrand;

var Link = ReactRouter.Link;

var Header = React.createClass({
    mixins: [
        Reflux.connect(PageStore, 'pages'),
        Reflux.connect(UserStore, 'users'),
        Reflux.connect(ConfigStore, 'config'),
        ReactIntl.IntlMixin
    ],

    componentDidMount: function()
    {
        UserAction.requireLogin();
    },

    render: function()
    {
        var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

		return (
            <div id="header">
                <Navbar fixedTop>
                    <Navbar.Header>
                        <NavbarBrand>
                            <div id="logo">
                                <Link to="/">
                                    <span className="cocorico-blue">co</span>
                                    <span className="cocorico-dark-grey">cori</span>
                                    <span className="cocorico-red">co</span>
                                </Link>
                            </div>
                        </NavbarBrand>
                        <Navbar.Toggle/>
                    </Navbar.Header>
                    <Navbar.Collapse>
                        <Nav>
                            {!this.state.pages ? '' : this.state.pages.navBar().map(function(page) {
                                return (
                                    <li key={page.slug}>
                                        <Link to={'/' + page.slug} activeClassName="active">
                                            {page.title}
                                        </Link>
                                    </li>
                                )
                            })}
        			    </Nav>
                        <Nav pullRight>
                            <li>
                                {!!currentUser && (this.state.config.capabilities.bill.create || this.state.config.capabilities.bill.edit)
                                    ? <Link to={this.getIntlMessage('route.MY_BILLS')} activeClassName="active">
                                        {this.getIntlMessage('page.myBills.TITLE')}
                                    </Link>
                                    : <div />}
                            </li>
                            <li>{!!currentUser ? <AccountDropdown fullName={currentUser.firstName + ' ' + currentUser.lastName}/> : ''}</li>
                            <li>{!currentUser ? <LoginButton /> : ''}</li>
                        </Nav>
                    </Navbar.Collapse>
    		  	</Navbar>
            </div>
		);
	}
});

module.exports = Header;
