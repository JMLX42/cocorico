var React = require('react');
var Reflux = require('reflux');
var ReactBootstrap = require('react-bootstrap');

var UserStore = require('../store/UserStore');

var UserAction = require('../action/UserAction');

var LoginButton = require('../component/LoginButton'),
  AuthenticationError = require('../component/AuthenticationError');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col;

var ForceAuthMixin = {
  mixins: [
    Reflux.listenTo(UserStore, 'userStoreChangedHandler'),
  ],

  getInitialState: function() {
    return {
      isAuthenticated: false,
    }
  },

  componentWillMount: function() {
    UserAction.requireLogin();
  },

  userStoreChangedHandler: function(store) {
    this.setState({
      isAuthenticated: store.isAuthenticated(),
    });

    if (store.authenticationFailed()) {
      this.render = this.renderAuthenticationError;
    }
  },

  isAuthenticated: function() {
    return this.state.isAuthenticated;
  },

  renderAuthenticationError: function() {
    return (
      <AuthenticationError/>
    );
  },

  renderLoginPage: function(message) {
    return (
      <div className="page">
        <Grid>
          <Row>
            <Col md={12}>
                {this.renderLoginMessage(message)}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  },

  renderLoginMessage: function(message) {
    return (<span>{message} <LoginButton /></span>);
  },
};

module.exports = ForceAuthMixin;
