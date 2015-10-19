var React = require('react')
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactRouter = require('react-router');

var Poll = require('./component/Poll');
var Header = require('./component/Header');
var Footer = require('./component/Footer');
var PollAction = require('./action/PollAction');
var PollStore = require("./store/PollStore");

var RouteHandler = ReactRouter.RouteHandler;

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row;

var Intl = require('./intl/intl');

var App = React.createClass({

	mixins: [Reflux.ListenerMixin, ReactIntl.IntlMixin],

	getInitialState: function()
    {
        return {
            latestPoll: PollStore.latest()
        };
    },

    getDefaultProps: function(){
        return {
            locales: Intl.locales,
            messages: Intl.messages
        };
    },

	componentDidMount: function()
    {
		this.listenTo(PollStore, this.onPollStoreChange);

		PollAction.showLatest();
    },

	onPollStoreChange: function(error, latest)
    {
        if (error)
            return;

        this.setState({
            latestPoll: PollStore.latest()
        });
    },

	render: function()
    {
		return (
			<div>
				<Header />
                    <div id="content">
                        <Grid>
    						<Row>
                                {this.props.children || ''}
    						</Row>
    					</Grid>
    				</div>
				<Footer />
			</div>
		);
	}
});

module.exports = App;
