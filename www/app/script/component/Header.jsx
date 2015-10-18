var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var Navbar = ReactBootstrap.Navbar,
    Nav = ReactBootstrap.Nav,
    NavItem = ReactBootstrap.NavItem,
    NavBrand = ReactBootstrap.NavBrand;

var Header = React.createClass({
    mixins: [ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div id="header">
                <Navbar>
    		    	<NavBrand>
                        <span style={{color:'blue'}}>co</span>
                        cori
                        <span style={{color:'red'}}>co</span>
                    </NavBrand>
                    <Nav right>
    					<NavItem eventKey={2} href="#">
                            {this.getIntlMessage('login.LOGIN')}
    					</NavItem>
    			    </Nav>
    		  	</Navbar>
            </div>
		);
	}
});

module.exports = Header;
