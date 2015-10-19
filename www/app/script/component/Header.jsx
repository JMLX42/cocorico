var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactRouter = require('react-router');

var PageStore = require('../store/PageStore');
var PageAction = require('../action/PageAction');

var Navbar = ReactBootstrap.Navbar,
    Nav = ReactBootstrap.Nav,
    NavItem = ReactBootstrap.NavItem,
    NavBrand = ReactBootstrap.NavBrand;

var Link = ReactRouter.Link;

var Header = React.createClass({
    mixins: [Reflux.connect(PageStore, 'pages'), ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div id="header">
                <Navbar fixedTop>
    		    	<NavBrand>
                        <Link to="/">
                            <span style={{color:'blue'}}>co</span>
                            cori
                            <span style={{color:'red'}}>co</span>                            
                        </Link>
                    </NavBrand>
                    <Nav>
                        {!this.state.pages ? '' : this.state.pages.navBar().map(function(page) {
                            return (
                                <li>
                                    <Link to={'/page/' + page.slug}>
                                        {page.title}
                                    </Link>
                                </li>
                            )
                        })}
    			    </Nav>
                    <Nav right>
    					<NavItem eventKey={1} href="#">
                            {this.getIntlMessage('login.LOGIN')}
    					</NavItem>
    			    </Nav>
    		  	</Navbar>
            </div>
		);
	}
});

module.exports = Header;
