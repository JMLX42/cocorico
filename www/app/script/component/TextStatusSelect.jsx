var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');

var Link = ReactRouter.Link;

var TextAction = require('../action/TextAction');

var TextStatusSelect = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    changeHandler: function(event)
    {
        TextAction.changeStatus(this.props.text.id, event.target.value);
    },

    options: {
        'draft': 'Brouillon',
        'review': 'Révision',
        'debate': 'Débat',
        'vote': 'Vote',
        'published': 'Publié'
    },

    render: function()
    {
		return (
            <select className={this.props.className} onChange={this.changeHandler}
                    value={this.props.text.status}>
                {Object.keys(this.options).map((key) => {
                    return (
                        <option value={key}>
                            {this.options[key]}
                        </option>
                    );
                })}
            </select>
		);
	}
});

module.exports = TextStatusSelect;
