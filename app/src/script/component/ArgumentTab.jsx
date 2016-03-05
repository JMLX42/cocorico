var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var ArgumentEditor = require('./ArgumentEditor'),
    LikeButtons = require('./LikeButtons'),
    Title = require('./Title');

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
        ArgumentAction.showBillArguments(this.props.bill.id);
    },

    renderArgumentList: function(args)
    {
        return (
            <ul className="list-unstyled argument-list">
                {!args || args.length == 0
                    ? <li>{this.getIntlMessage('bill.NO_ARGUMENT')}</li>
                    : args.sort((a, b)=> b.score - a.score).map((arg) => {
                        return (
                            <li>
                                <h4><Title text={arg.title}/></h4>
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
            ? this.state.args.getArgumentsByBillId(this.props.bill.id)
            : null;

        if (this.state.args
            && this.state.args.billArgumentLoading(this.props.bill.id))
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
                {!this.props.editable
                    ? <Row>
                        <Col md={12}>
                            <p className="hint">
                                {this.getIntlMessage('bill.TOO_LATE_TO_DEBATE')}
                            </p>
                        </Col>
                    </Row>
                    : <div/>}
                {this.props.editable && !this.isAuthenticated()
                    ? <Row>
                        <Col md={12}>
                            <p className="hint">
                                {this.renderLoginMessage(this.getIntlMessage('bill.ADD_ARGUMENT_LOGIN'))}
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
                            ? <ArgumentEditor billId={this.props.bill.id}
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
                            ? <ArgumentEditor billId={this.props.bill.id}
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
