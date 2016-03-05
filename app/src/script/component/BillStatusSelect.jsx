var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var Link = ReactRouter.Link;

var BillAction = require('../action/BillAction');

var ConfigStore = require('../store/ConfigStore');

var BillStatusSelect = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(ConfigStore, 'config')
    ],

    componentWillMount: function()
    {
        this.initializeOptions();
    },

    initializeOptions : function()
    {
        this.options = {};

        if (this.state.config.capabilities.step.draft)
            this.options.draft = this.getIntlMessage('bill.STATUS_DRAFT');
        if (this.state.config.capabilities.step.review)
            this.options.review = this.getIntlMessage('bill.STATUS_REVIEW');
        if (this.state.config.capabilities.step.debate)
            this.options.debate = this.getIntlMessage('bill.STATUS_DEBATE');
        if (this.state.config.capabilities.step.vote)
            this.options.vote = this.getIntlMessage('bill.STATUS_VOTE');
        if (this.state.config.capabilities.step.published)
            this.options.published = this.getIntlMessage('bill.STATUS_PUBLISHED');
    },

    changeHandler: function(event)
    {
        BillAction.changeStatus(this.props.bill.id, event.target.value);
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
