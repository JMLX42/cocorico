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

var FormattedMessage = ReactIntl.FormattedMessage;

var Hint = require('./Hint');

var ArgumentAction = require('../action/ArgumentAction');

var Bill = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getInitialState: function()
    {
        return {
            expanded : this.props.expanded,
            argumentTitle: '',
            argumentContent: ''
        };
    },

    getDefaultProps: function()
    {
        return {
            expanded : false
        };
    },

    buttonClickHandler: function(e)
    {
        ArgumentAction.add(
            this.props.billId,
            this.props.value,
            this.state.argumentTitle,
            this.state.argumentContent
        );

        this.setState({expanded : false});
    },

    render: function()
    {
        if (!this.state.expanded)
            return (
                <div className="argument-editor">
                    <Button bsStyle={this.props.value ? 'primary' : 'danger'}
                        onClick={(e)=>this.setState({expanded:true})}
                        className="btn-add-argument">
                        <FormattedMessage message={this.getIntlMessage('bill.ADD_ARGUMENT')}
                            value={this.getIntlMessage('bill.VOTE_YES')}/>
                    </Button>
                </div>
            );

        return (
            <div className="argument-editor">
                <Row>
                    <Col md={12}>
                        <Input type="bill"
                            placeholder="Titre de votre argument"
                            onChange={(e)=>this.setState({ argumentTitle: e.target.value })}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <Input type="textarea"
                            placeholder="Bille de votre argument"
                            onChange={(e)=>this.setState({ argumentContent: e.target.value })}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <Button bsStyle={this.props.value ? 'primary' : 'danger'}
                            onClick={this.buttonClickHandler}>
                            Ajouter
                        </Button>
                        <Button bsStyle="link" onClick={(e)=>{this.setState({expanded:false})}}>
                            Annuler
                        </Button>
                    </Col>
                </Row>
            </div>
        );
	}
});

module.exports = Bill;
