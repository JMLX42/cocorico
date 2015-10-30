var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactRouter = require('react-router');
var Reflux = require('reflux');

var TextAction = require("../action/TextAction");
var TextStore = require("../store/TextStore");

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Link = ReactRouter.Link;

var TextList = React.createClass({

    mixins: [Reflux.connect(TextStore, 'texts')],

    componentDidMount: function()
    {
        TextAction.list();
    },

	render: function()
    {
        if (!this.state.texts)
            return null;

		return (
            <Grid>
                <Row>
        			<ul className="list-unstyled">
                        {this.state.texts.get().map(function(text)
                        {
                            return <li>
                                <Link to={'/text/' + text.slug}>
                                    {text.title}
                                </Link>
                            </li>;
                        })}
        			</ul>
                </Row>
            </Grid>
		);
	}
});

module.exports = TextList;
