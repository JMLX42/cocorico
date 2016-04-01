var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var ReactDocumentTitle = require('react-document-title');

var LoadingIndicator = require('../component/LoadingIndicator');

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
        return status ? 'positive' : 'negative';
    },

    render: function()
    {
        if (!this.state.serviceStatus)
            return (
                <div className="page">
                    <Grid>
                        <Row>
                            <Col md={12}>
                                <LoadingIndicator/>
                            </Col>
                        </Row>
                    </Grid>
                </div>
            );

        var system = this.state.serviceStatus.getSystemStatus();
        var capabilities = this.state.serviceStatus.getSystemCapabilities();

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
                                            <th style={{width:'25%'}}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Blockchain Node</td>
                                            <td className={this.getStatusClassNames(system.blockchainNode)}>
                                                {system.blockchainNode ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Blockchain Miner</td>
                                            <td className={this.getStatusClassNames(system.blockchainMiner)}>
                                                {system.blockchainMiner ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Queue</td>
                                            <td className={this.getStatusClassNames(system.queue)}>
                                                {system.queue ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Database</td>
                                            <td className={this.getStatusClassNames(system.database)}>
                                                {system.database ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Table style={{width:'100%'}} striped hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Capability</th>
                                            <th style={{width:'25%'}}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Vote</td>
                                            <td className={this.getStatusClassNames(capabilities.vote)}>
                                                {capabilities.vote ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Read Bill</td>
                                            <td className={this.getStatusClassNames(capabilities.readBill)}>
                                                {capabilities.readBill ? 'OK' : 'KO'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Create Bill</td>
                                            <td className={this.getStatusClassNames(capabilities.createBill)}>
                                                {capabilities.createBill ? 'OK' : 'KO'}
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
