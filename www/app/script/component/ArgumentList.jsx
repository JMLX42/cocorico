var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var ReactIntl = require('react-intl');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var ArgumentList = React.createClass({

    mixins: [ReactIntl.IntlMixin],

	render: function()
    {
        var args = this.props.args || [];
        var filteredArgs = [];
        for (var arg of args)
            if (!this.props.filterFunction || this.props.filterFunction(arg))
                filteredArgs.push(arg);

		return (
            <div>
                <ul className="list-unstyled argument-list">
                    {filteredArgs.length == 0
                        ? <li>{this.getIntlMessage('text.NO_ARGUMENT')}</li>
                    : filteredArgs.map((text) => {
                            return (
                                <li>
                                    <h4>{arg.title}</h4>
                                    <p>{arg.content}</p>
                                </li>
                            );}
                        )
                    }
    			</ul>
            </div>
		);
	}
});

module.exports = ArgumentList;
