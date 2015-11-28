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

    mixins: [ReactIntl.IntlMixin],

	render: function()
    {
        var texts = this.props.texts || [];

        var filteredTexts = texts.filter((text) => {
            return !this.props.filterFunction || this.props.filterFunction(text)
        });

		return (
            <div>
                <ul className="list-unstyled text-list">
                    {filteredTexts.length == 0
                        ? <li>{this.getIntlMessage('page.myTexts.NO_TEXT')}</li>
                        : filteredTexts.map((text) => {
                            return (
                                <li>
                                    <TextLink text={text}/>
                                    {this.props.editable
                                        ? <Link to={this.getIntlMessage('route.EDIT_TEXT') + '/' + text.id + '/' + text.slug} className="pull-right">Modifier</Link>
                                        : ''}
                                    {this.props.editable
                                        ? <TextStatusSelect text={text} className="pull-right"/>
                                        : ''}
                                </li>
                            );}
                        )
                    }
    			</ul>
            </div>
		);
	}
});

module.exports = TextList;
