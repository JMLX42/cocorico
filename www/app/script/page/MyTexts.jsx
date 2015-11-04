var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var TextAction = require("../action/TextAction");
var TextStore = require("../store/TextStore");

var TextList = require("../component/TextList");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var Link = ReactRouter.Link;

var MyTexts = React.createClass({

    mixins: [Reflux.connect(TextStore, 'texts'), ReactIntl.IntlMixin],

    componentDidMount: function()
    {
        TextAction.listCurrentUserTexts();
    },

	render: function()
    {
        var texts = this.state.texts
            ? this.state.texts.getCurrentUserTexts()
            : null;

		return (
            <div className="page">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h1>{this.getIntlMessage('page.myTexts.TITLE')}</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {!texts
                                ? <div/>
                                : texts.length == 0
                                    ? <p>{this.getIntlMessage('page.myTexts.NO_TEXT')}</p>
                                    : <TextList texts={texts}/>}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Link to={this.getIntlMessage('route.CREATE_TEXT')}>
                                <Button bsSize="large" bsStyle="primary">
                                    {this.getIntlMessage('page.myTexts.NEW_TEXT')}
                                </Button>
                            </Link>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = MyTexts;
