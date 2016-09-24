var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');

var LoadingIndicator = require('../component/LoadingIndicator');

var UserAction = require('../action/UserAction');

var UserStore = require('../store/UserStore');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col,
  Button = ReactBootstrap.Button;

var Login = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(UserStore, 'users'),
  ],

  contextTypes: {
    location: React.PropTypes.object,
  },

  getInitialState: function() {
    return {
      redirect: this.context.location
        ? !!this.context.location.query.redirect
          ? this.context.location.query.redirect
          : '/' + this.context.location.pathname
        : this.props.redirect,
    };
  },

  componentWillMount: function() {
    UserAction.listAuthProviders();
  },

  render: function() {
    var authProviders = this.state.users.getAuthProviders();
    var redirect = this.state.redirect
      ? '?redirect=' + encodeURIComponent(this.state.redirect)
      : '';
    var displayName = {
      'facebook' : 'Facebook',
      'france-connect' : 'FranceConnect',
      'google' : 'Google',
    };

    return (
      <ReactDocumentTitle title={this.getIntlMessage('login.SIGN_IN') + ' - ' + this.getIntlMessage('site.TITLE')}>
        <div className="page page-login">
          <Grid>
            {this.props.message
              ? <Row>
                <Col md={12}>
                  <p>
                    {this.props.message}
                  </p>
                </Col>
              </Row>
              : <div/>}
            <Row>
              <Col md={4} mdPush={4} sm={6} smPush={3} xs={10} xsPush={1}>
                {!authProviders
                  ? <div className="text-center">
                    <LoadingIndicator/>
                  </div>
                  : <div>
                    <p className="text-center">
                      {this.getIntlMessage('login.SIGN_IN_WITH')}
                    </p>
                    <ul className="list-unstyled text-center">
                      {authProviders && authProviders.map((provider) => {
                        return (
                          <li key={provider.name}>
                            <a href={provider.url + redirect}>
                              <Button className={'btn-login btn-login-' + provider.name}>
                                <span className={'icon-' + provider.name}/>
                                {displayName[provider.name]}
                              </Button>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>}
              </Col>
            </Row>
          </Grid>
        </div>
      </ReactDocumentTitle>
		);
  },
});

module.exports = Login;
