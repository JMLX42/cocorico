var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var TextAction = require("../action/TextAction");
var TextStore = require("../store/TextStore");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var TextList = React.createClass({

    mixins: [ReactIntl.IntlMixin, Reflux.connect(TextStore, 'texts')],

    componentDidMount: function()
    {
        if (!this.props.texts)
            TextAction.list();
    },

	render: function()
    {
        var texts = this.props.texts
            ? this.props.texts
            : this.state.texts
                ? this.state.texts.get()
                : null;

        if (!texts)
            return null;

		return (
            <Grid>
                <Row>
        			<ul className="list-unstyled">
                        {texts.map((text) => {
                            return <li>
                                <Link to={this.getIntlMessage('route.VIEW_TEXT') + '/' + text.slug}>
                                    {text.title}
                                </Link>
                                {this.props.editable
                                    ? <Link to={this.getIntlMessage('route.EDIT_TEXT') + '/' + text.slug} className="pull-right">Modifier</Link>
                                    : <div/>}
                                {this.props.deletable
                                    ? <Link to="/" className="pull-right">Supprimer</Link>
                                    : <div/>}
                            </li>;
                        })}
        			</ul>
                </Row>
            </Grid>
		);
	}
});

module.exports = TextList;
