var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactDocumentTitle = require('react-document-title');

var ServiceStatusAction = require('../action/ServiceStatusAction');

var ServiceStatusStore = require('../store/ServiceStatusStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Table = ReactBootstrap.Table;

module.exports = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(ServiceStatusStore, 'serviceStatus')
    ],

    componentWillMount: function()
    {
        ServiceStatusAction.showStatus();
    },

    componentDidMount: function()
    {
        this.interval = setInterval(
            () => ServiceStatusAction.updateStatus(),
            10000
        );
    },

    componentWillUnmount: function()
    {
        clearInterval(this.interval);
    },

    getStatusClassNames: function(status)
    {
        return status ? 'cocorico-blue' : 'cocorico-red';
    },

    render: function()
    {
        var status = this.state.serviceStatus.getStatus();

		return (
            <ReactDocumentTitle title={'Service Status - ' + this.getIntlMessage('site.TITLE')}>
                <div className="page">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <Table style={{width:'100%'}} striped hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Blockchain</td>
                                            <td className={this.getStatusClassNames(status.blockchain)}>
                                                {status.blockchain ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Blockchain Miner</td>
                                            <td className={this.getStatusClassNames(status.blockchainMiner)}>
                                                {status.blockchainMiner ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Queue</td>
                                            <td className={this.getStatusClassNames(status.queue)}>
                                                {status.queue ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Database</td>
                                            <td className={this.getStatusClassNames(status.database)}>
                                                {status.database ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Grid>
                </div>
            </ReactDocumentTitle>
		);
	}
});
