var React = require('react');
var Markdown = require('react-remarkable');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Input = ReactBootstrap.Input;

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
    },

    componentWillReceiveProps: function(props)
    {
    },

    render: function()
    {
        return (
            <Grid className="argument-editor">
                <Row>
                    <Col md={12}>
                        <Input type="textarea"/>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <Button bsStyle="primary">Ajouter</Button>
                    </Col>
                </Row>
            </Grid>
        );
	}
});

module.exports = Text;
