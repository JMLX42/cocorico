var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var TextAction = require("../action/TextAction");
var TextStore = require("../store/TextStore");
var TextLink = require("../component/TextLink"),
    TextStatusSelect = require("../component/TextStatusSelect");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var TextList = React.createClass({

    mixins: [ReactIntl.IntlMixin, Reflux.connect(TextStore, 'texts')],

    componentDidMount: function()
    {
        if (!this.props.texts)
            TextAction.showLatestTexts();
    },

    componentWillReceiveProps: function(props)
    {
        if (!props.texts)
            TextAction.showLatestTexts();
    },

	render: function()
    {
        var texts = this.props.texts
            ? this.props.texts
            : this.state.texts
                ? this.state.texts.getLatestTexts()
                : null;

        if (!texts)
            return null;

        if (texts.length == 0)
            return (
                <p>{this.getIntlMessage('page.myTexts.NO_TEXT')}</p>
            );

        var filteredTexts = [];
        for (var text of texts)
            if (!this.props.filterFunction || this.props.filterFunction(text))
                filteredTexts.push(text);

		return (
            <div>
                {filteredTexts.length == 0
                    ? <p>{this.getIntlMessage('page.myTexts.NO_TEXT')}</p>
                    : <ul className="list-unstyled text-list">
                        {filteredTexts.map((text) => {
                            return (<li>
                                <TextLink text={text}/>
                                {this.props.editable
                                    ? <Link to={this.getIntlMessage('route.EDIT_TEXT') + '/' + text.id + '/' + text.slug} className="pull-right">Modifier</Link>
                                    : ''}
                                {this.props.editable
                                    ? <TextStatusSelect text={text} className="pull-right"/>
                                    : ''}
                            </li>);
                        })}
        			</ul>}
            </div>
		);
	}
});

module.exports = TextList;
