var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactRouter = require('react-router');
var ReactDOM = require('react-dom');

var PageStore = require('../store/PageStore'),
  UserStore = require('../store/UserStore'),
  ConfigStore = require('../store/ConfigStore');

var UserAction = require('../action/UserAction');

var LoginButton = require('./LoginButton'),
  AccountDropdown = require('./AccountDropdown'),
  Title = require('./Title');

var Navbar = ReactBootstrap.Navbar,
  Nav = ReactBootstrap.Nav,
  NavbarBrand = ReactBootstrap.NavbarBrand;

var Link = ReactRouter.Link;

var Header = React.createClass({
  mixins: [
    Reflux.connect(PageStore, 'pages'),
    Reflux.connect(UserStore, 'users'),
    Reflux.connect(ConfigStore, 'config'),
    ReactIntl.IntlMixin,
  ],

  componentDidMount: function() {
    UserAction.requireLogin();

    const navBar = ReactDOM.findDOMNode(this).querySelector('nav.navbar');
    const collapsibleNav = navBar.querySelector('div.navbar-collapse');
    const btnToggle = navBar.querySelector('button.navbar-toggle');

    navBar.addEventListener('click', (evt) => {
      if (evt.target.tagName !== 'A' || evt.target.classList.contains('dropdown-toggle')
          || ! collapsibleNav.classList.contains('in')) {
        return;
      }

      btnToggle.click();
    }, false);
  },

  renderLoginButtonOrAccountDropDown() {
    if (!this.state.config.capabilities.user.sign_in) {
      return null;
    }

    var currentUser = this.state.users
            ? this.state.users.getCurrentUser()
            : null;

    return (
      !!currentUser
        ? <AccountDropdown fullName={currentUser.firstName + ' ' + currentUser.lastName}/>
        : <LoginButton />
    );
  },

  render: function() {
    return (
      <div id="header">
        <Navbar fixedTop={true}>
          <Navbar.Header>
            <NavbarBrand>
              <div id="logo">
                <Link to="/">
                  <span className="cocorico-dark-grey">cocorico</span>
                  <small>beta</small>
                </Link>
              </div>
            </NavbarBrand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse ref="headerMenu">
            <Nav>
              <li>
                <Link to={this.getIntlMessage('slug.ABOUT')}
                  activeClassName="active">
                  <Title text={this.getIntlMessage('title.ABOUT')}/>
                </Link>
              </li>
    			  </Nav>
            <Nav pullRight={true}>
              <li>
                {this.renderLoginButtonOrAccountDropDown()}
              </li>
            </Nav>
          </Navbar.Collapse>
  		  	</Navbar>
      </div>
		);
  },
});

module.exports = Header;
