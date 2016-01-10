var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactCookie = require('react-cookie');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var Page = require('./Page'),
    PageTitle = require('./PageTitle');

var Link = ReactRouter.Link;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar;

var Hint = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getInitialState: function()
    {
        return {
            hidden : ReactCookie.load('hint/' + this.props.pageSlug)
        };
    },

    buttonClickHandler: function(e)
    {
        var hidden = !this.state.hidden;

        this.setState({hidden : hidden});
        ReactCookie.save('hint/' + this.props.pageSlug, hidden);
    },

    render: function()
    {
        if (this.state.hidden)
        {
            return (
                <a onClick={this.buttonClickHandler}
                    className="btn-hint-show">
                    <span className="icon-info"/>
                    <PageTitle slug={this.props.pageSlug} className="hint-title"/>
                </a>
            );
        }

		return (
            <div className={this.props.className}>
                <div className="hint-content">
                    <Page slug={this.props.pageSlug}/>
                </div>
                {this.props.disposable
                    ? <ButtonToolbar>
                        <Button onClick={this.buttonClickHandler}>
                            J'ai compris, ne plus afficher ce message
                        </Button>
                        {this.props.morePageSlug
                            ? <Link to={'/' + this.props.morePageSlug}>
                            <Button bsStyle="link">
                                En savoir plus...
                            </Button>
                        </Link>
                        : <span/>}
                    </ButtonToolbar>
                    : <div/>}
            </div>
		);
	}
});

module.exports = Hint;
