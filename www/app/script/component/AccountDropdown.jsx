var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');

var DropdownButton = ReactBootstrap.DropdownButton,
    MenuItem = ReactBootstrap.MenuItem;

var Link = ReactRouter.Link;

var AccountDropdown = React.createClass({

    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <DropdownButton title={this.props.fullName} className="account-dropdown" id="account-dropdown">
                <MenuItem eventKey="1" href="/auth/logout">
                    {this.getIntlMessage('login.SIGN_OUT')}
                </MenuItem>
            </DropdownButton>
		);
	}
});

module.exports = AccountDropdown;
