var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');

var Title = require('./Title');

var FormattedMessage = ReactIntl.FormattedMessage;

var Link = ReactRouter.Link;

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col;

var Footer = React.createClass({

  mixins: [ReactIntl.IntlMixin],

  contextTypes: {
    location: React.PropTypes.object,
  },

  render: function() {
    var isEmbed = this.context.location.pathname.indexOf('embed') === 0;
    var target = isEmbed ? '_blank' : '_self';

    return (
      <div id="footer">
        <Grid>
          <Row>
            <Col md={9} sm={9} xsHidden={true}>
              <ul className="list-unstyled list-inline">
                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                  <Link to={this.getIntlMessage('slug.PRIVACY_POLICY')}
                    target={target}>
                    <Title text={this.getIntlMessage('title.PRIVACY_POLICY')}/>
                  </Link>
                </li>
                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                  <a href="https://github.com/promethe42/cocorico"
                    target="_blank">
                    {this.getIntlMessage('title.SOURCE_CODE')}
                  </a>
                </li>
                <li className="visible-xs-block visible-sm-inline visible-md-inline visible-lg-inline">
                  <Link to={this.getIntlMessage('route.SERVICE_STATUS')}
                    target={target}>
                    <Title text={this.getIntlMessage('title.SERVICE_STATUS')}/>
                  </Link>
                </li>
              </ul>
            </Col>
            <Col md={3} sm={3} xs={12} className="text-right">
              <ul className="list-unstyled list-inline">
                <li className="visible-xs-inline hidden-sm hidden-md hidden-lg">
                  <Link to={this.getIntlMessage('slug.PRIVACY_POLICY')}
                    target={target}>
                    <Title text={this.getIntlMessage('title.PRIVACY_POLICY')}/>
                  </Link>
                </li>
                {isEmbed
                  ? <li>
                    <a href="/" target={target}>
                      <FormattedMessage
                        message={this.getIntlMessage('site.POWERED_BY')}
                        productName="Cocorico"/>
                    </a>
                  </li>
                  : null}
              </ul>
            </Col>
          </Row>
        </Grid>
      </div>
		);
  },
});

module.exports = Footer;
