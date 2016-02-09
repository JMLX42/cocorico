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

var TextAction = require('../action/TextAction'),
    UserAction = require('../action/UserAction');

var TextStore = require('../store/TextStore'),
    UserStore = require('../store/UserStore');

var Text = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(TextStore, 'texts'),
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
        this.listenTo(TextStore, (store) => {
            var text = this.props.textId
                ? store.getById(this.props.textId)
                : store.getLastCreated();

            if (text)
            {
                this.setState({
                    id: text.id,
                    title: text.title,
                    content: text.content.md
                });
            }
        });

        if (this.props.textId)
            TextAction.show(this.props.textId);

        UserAction.requireLogin();
    },

    componentWillReceiveProps: function(props)
    {
        if (props.textId)
            this.setState({id : props.textId});
    },

    handleClick: function()
    {
        TextAction.save(this.state.id, this.state.title, this.state.content);
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
        var text = this.state && this.state.texts
            ? this.state.texts.getById(this.state.id)
            : null;

        return (
            <Grid className="text-editor">
                <Row>
                    <Col md={12}>
                        <h2>{this.getIntlMessage('textEditor.TITLE')}</h2>
                        <Input type="text" name="title" value={this.state.title}
                               onChange={this.handleTitleChange}
                               placeholder={this.getIntlMessage('textEditor.TITLE_PLACEHOLDER')}>
                        </Input>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h2>{this.getIntlMessage('textEditor.CONTENT')}</h2>
                        <Input type="textarea" name="content" className="text-content"
                               value={this.state.content} onChange={this.handleContentChange}
                               placeholder={this.getIntlMessage('textEditor.CONTENT_PLACEHOLDER')}>
                        </Input>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <ButtonToolbar>
                            <Button bsSize="large" bsStyle="primary" onClick={this.handleClick}>
                                {this.getIntlMessage('textEditor.BUTTON_SAVE')}
                            </Button>
                            {!!text
                                ? <Link to={this.getIntlMessage('route.VIEW_TEXT') + '/' + text.id + '/' + text.slug}>
                                    <Button bsSize="large" bsStyle="link">
                                        {this.getIntlMessage('textEditor.BUTTON_VIEW')}
                                    </Button>
                                </Link>
                                : <div/>}
                        </ButtonToolbar>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h1>{this.state.title}</h1>
                        <Markdown>
                           {this.state.content}
                        </Markdown>
                    </Col>
                </Row>
            </Grid>
        );
	}
});

module.exports = Text;
