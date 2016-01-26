var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var QRCode = require('../component/QRCode'),
    QRCodeReader = require('../component/QRCodeReader');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button;

var BlockchainAccountTest = React.createClass({

    mixins: [
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts')
    ],

    getInitialState: function()
    {
        return {
            scannedPrivateKey: null
        }
    },

    componentWillMount: function()
    {
        BlockchainAccountAction.create('test');
    },

    render: function()
    {
        var account = this.state.blockchainAccounts
            ? this.state.blockchainAccounts.getCurrentUserAccount()
            : null;

        if (!account)
            return null;

		return (
            <div className="page">
                <Grid>
                    <Row>
                        <Col md={12}>
                            <h1>Blockchain Account Test</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <QRCode type={9} level="Q" text={account.private}/>
                        </Col>
                        <Col md={6}>
                            <QRCode type={9} level="Q" text={account.address}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <h2>Your Private Key:</h2>
                            <p>{account.private}</p>
                            <h2>Your Address:</h2>
                            <p>{account.address}</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <h2>Scan Your Private Key:</h2>
                            {this.state.scannedPrivateKey
                                ? <div>
                                    <p style={{color:this.state.scannedPrivateKey == account.private ? 'green' : 'red'}}>
                                        Scanned private key: {this.state.scannedPrivateKey}
                                    </p>
                                    {this.state.scannedPrivateKey != account.private
                                        ? <Button onClick={(e)=>this.setState({ scannedPrivateKey : null })}>
                                            Retry
                                        </Button>
                                        : <div/>}
                                </div>
                                : <QRCodeReader success={(r)=>this.setState({ scannedPrivateKey : r })}/>}
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = BlockchainAccountTest;
