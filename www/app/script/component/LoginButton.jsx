var React = require('react');

var LoginButton = React.createClass({

    render: function()
    {
		return (
            <a href="/auth/login">
                <img src="/img/franceconnect_logo_login.png" className="btn-login"/>
            </a>
		);
	}
});

module.exports = LoginButton;
