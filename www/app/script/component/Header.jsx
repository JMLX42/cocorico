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

var LoginButton = require('./LoginButton');

var Header = React.createClass({
    mixins: [Reflux.connect(PageStore, 'pages'), ReactIntl.IntlMixin],

    render: function()
    {
		return (
            <div id="header">
                <Navbar fixedTop>
    		    	<NavBrand>
                        <div id="logo">
                            <Link to="/">
                                <span style={{color:'blue'}}>co</span>
                                <span style={{color:'grey'}}>cori</span>
                                <span style={{color:'red'}}>co</span>
                            </Link>
                        </div>
                    </NavBrand>
                    <Nav>
                        {!this.state.pages ? '' : this.state.pages.navBar().map(function(page) {
                            return (
                                <li>
                                    <Link to={'/page/' + page.slug} activeClassName="active">
                                        {page.title}
                                    </Link>
                                </li>
                            )
                        })}
    			    </Nav>
                    <Nav right>
    					<li>
                            <LoginButton />
    					</li>
    			    </Nav>
    		  	</Navbar>
            </div>
		);
	}
});

module.exports = Header;
