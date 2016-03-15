var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var ReactDocumentTitle = require('react-document-title');
var Reflux = require('reflux');
var Markdown = require('react-remarkable');

var FormattedMessage = ReactIntl.FormattedMessage,
    FormattedTime = ReactIntl.FormattedTime;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Input = ReactBootstrap.Input;

var Link = ReactRouter.Link;

var Title = require('./Title');

var BillAction = require('../action/BillAction'),
    UserAction = require('../action/UserAction');

var BillStore = require('../store/BillStore'),
    UserStore = require('../store/UserStore');

var Bill = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(BillStore, 'bills'),
        Reflux.connect(UserStore, 'users')
    ],

    getInitialState: function()
    {
        return {
            id: null,
            title: '',
            content: ''
        };
    },

    componentDidMount: function()
    {
        this.listenTo(BillStore, (store) => {
            var bill = this.props.billId
                ? store.getById(this.props.billId)
                : store.getLastCreated();

            if (bill)
            {
                this.setState({
                    id: bill.id,
                    title: bill.title,
                    content: bill.content.md
                });
            }
        });

        if (this.props.billId)
            BillAction.show(this.props.billId);

        UserAction.requireLogin();
    },

    componentWillReceiveProps: function(props)
    {
        if (props.billId)
            this.setState({id : props.billId});
    },

    handleClick: function()
    {
        BillAction.save(this.state.id, this.state.title, this.state.content);
    },

    handleTitleChange: function(event)
    {
        this.setState({ title: event.target.value });
    },

    handleContentChange: function(event)
    {
        this.setState({ content: event.target.value });
    },

    render: function()
    {
        var bill = this.state && this.state.bills
            ? this.state.bills.getById(this.state.id)
            : null;

        return (
            <Grid className="bill-editor">
                <Row>
                    <Col md={12}>
                        <h2>{this.getIntlMessage('billEditor.TITLE')}</h2>
                        <Input type="bill" name="title" value={this.state.title}
                               onChange={this.handleTitleChange}
                               placeholder={this.getIntlMessage('billEditor.TITLE_PLACEHOLDER')}>
                        </Input>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h2>{this.getIntlMessage('billEditor.CONTENT')}</h2>
                        <Input type="textarea" name="content" className="bill-content"
                               value={this.state.content} onChange={this.handleContentChange}
                               placeholder={this.getIntlMessage('billEditor.CONTENT_PLACEHOLDER')}>
                        </Input>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <ButtonToolbar>
                            <Button bsSize="large" bsStyle="primary" onClick={this.handleClick} disabled={!this.state.content || !this.state.title}>
                                {this.getIntlMessage('billEditor.BUTTON_SAVE')}
                            </Button>
                            {!!bill
                                ? <Link to={this.getIntlMessage('route.VIEW_BILL') + '/' + bill.slug}>
                                    <Button bsSize="large" bsStyle="link">
                                        {this.getIntlMessage('billEditor.BUTTON_VIEW')}
                                    </Button>
                                </Link>
                                : <div/>}
                        </ButtonToolbar>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h1><Title text={this.state.title}/></h1>
                        <Markdown>
                           {this.state.content}
                        </Markdown>
                    </Col>
                </Row>
            </Grid>
        );
	}
});

module.exports = Bill;
