var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');

var Link = ReactRouter.Link;

var BillAction = require('../action/BillAction');

var BillStatusSelect = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    changeHandler: function(event)
    {
        BillAction.changeStatus(this.props.bill.id, event.target.value);
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
                    value={this.props.bill.status}>
                {Object.keys(this.options).map((key) => {
                    return (
                        <option value={key} key={key}>
                            {this.options[key]}
                        </option>
                    );
                })}
            </select>
		);
	}
});

module.exports = BillStatusSelect;
