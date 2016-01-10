var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var StringHelper = require('../helper/StringHelper');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var ArgumentEditor = require('./ArgumentEditor'),
    LikeButtons = require('./LikeButtons');

var ArgumentAction = require('../action/ArgumentAction');

var ArgumentStore = require('../store/ArgumentStore');

var Link = ReactRouter.Link;

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedHTMLMessage = ReactIntl.FormattedHTMLMessage;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var Footer = React.createClass({

    mixins: [
        ForceAuthMixin,
        ReactIntl.IntlMixin,
        Reflux.connect(ArgumentStore, 'args')
    ],

    componentWillMount: function()
    {
        ArgumentAction.showTextArguments(this.props.text.id);
    },

    renderArgumentList: function(args)
    {
        return (
            <ul className="list-unstyled argument-list">
                {!args || args.length == 0
                    ? <li>{this.getIntlMessage('text.NO_ARGUMENT')}</li>
                    : args.sort((a, b)=> b.score - a.score).map((arg) => {
                        return (
                            <li>
                                <h4>{StringHelper.toTitleCase(arg.title)}</h4>
                                <LikeButtons likeAction={ArgumentAction.like}
                                    resource={arg}
                                    likeButtonEnabled={this.props.editable}
                                    dislikeButtonEnabled={this.props.editable}/>
                                <p>{arg.content}</p>
                            </li>
                        );
                    })}
			</ul>
		);
    },

    render: function()
    {
        var args = this.state.args
            ? this.state.args.getArgumentsByTextId(this.props.text.id)
            : null;

        if (this.state.args
            && this.state.args.textArgumentLoading(this.props.text.id))
            return (
                <Grid className="argument-tab">
                    <Row>
                        <Col md={12}>
                            Chargement...
                        </Col>
                    </Row>
                </Grid>
            );

        var pros = args
            ? args.filter((arg)=>{if (arg.value) return arg;})
            : null;

        var cons = args
            ? args.filter((arg)=>{if (!arg.value) return arg;})
            : null;

		return (
            <Grid className="argument-tab">
                {this.props.editable && !this.isAuthenticated()
                    ? <Row>
                        <Col md={12}>
                            <p className="hint">
                                {this.renderLoginMessage(this.getIntlMessage('text.ADD_ARGUMENT_LOGIN'))}
                            </p>
                        </Col>
                    </Row>
                    : <div/>}
                <Row>
                    <Col md={6}>
                        <h3>
                            Arguments '<span className="cocorico-blue">pour</span>' ({pros ? pros.length : 0})
                            <span className="small">
                                &nbsp;
                                <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                    gender="male"/>
                            </span>
                        </h3>
                        {this.props.editable && this.isAuthenticated()
                            ? <ArgumentEditor textId={this.props.text.id}
                                value={true}/>
                            : <div/>}
                        {this.renderArgumentList(pros)}
                    </Col>
                    <Col md={6}>
                        <h3>
                            Arguments '<span className="cocorico-red">contre</span>' ({cons ? cons.length : 0})
                            <span className="small">
                                &nbsp;
                                <FormattedMessage message={this.getIntlMessage('sort.SORTED_BY_POPULARITY')}
                                    gender="male"/>
                            </span>
                        </h3>
                        {this.props.editable && this.isAuthenticated()
                            ? <ArgumentEditor textId={this.props.text.id}
                                value={false}/>
                            : <div/>}
                        {this.renderArgumentList(cons)}
                    </Col>
                </Row>
            </Grid>
		);
	}
});

module.exports = Footer;
