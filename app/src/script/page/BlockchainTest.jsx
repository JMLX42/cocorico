var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var Web3 = require('web3');

var contract = require('/opt/cocorico/blockchain/contract.json');

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
        console.log(contract);
        return {
            scannedPrivateKey           : null,
            doScan                      : false,
            smartContractNode           : false,
            smartContractStatus         : 'N/A',
            smartContractAddress        : '',
            smartContractReturn         : '',
            smartContractTransaction    : ''
        }
    },

    componentWillMount: function()
    {
        BlockchainAccountAction.create('test');

        this.createGreeter();
    },

    createGreeter: function()
    {
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));

        var _greeting = "Hello World!"
        var greeterContract = web3.eth.contract(eval(contract.contracts.greeter.abi));
        var connected = web3.isConnected();

        this.setState({
            smartContractStatus : 'creating',
            smartContractNode   : connected
        });

        if (!connected)
            return;

        var greeter = greeterContract.new(
            _greeting,
            {from : web3.eth.accounts[0], data : contract.contracts.greeter.bin, gas : 300000},
            (error, contract) => {
                if (!error)
                {
                    if (!contract.address)
                        this.setState({
                            smartContractStatus      : 'contract transaction sent',
                            smartContractTransaction : contract.transactionHash
                        });
                    else
                    {
                        this.setState({
                            smartContractStatus     : 'mined',
                            smartContractAddress    : contract.address,
                            smartContractReturn     : greeter.greet()
                        });
                    }
                }
                else
                {
                    console.error(error);
                }
            }
        );
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
                            <h1>Blockchain Test</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <h2>Wallet</h2>
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
                            <h3>Your Private Key:</h3>
                            <p>{account.private}</p>
                            <h3>Your Address:</h3>
                            <p>{account.address}</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <h3>Scan Your Private Key:</h3>
                            {this.state.scannedPrivateKey
                                ? <div>
                                    <p style={{color:this.state.scannedPrivateKey == account.private ? 'green' : 'red'}}>
                                        {this.state.scannedPrivateKey}
                                    </p>
                                    {this.state.scannedPrivateKey != account.private
                                        ? <Button onClick={(e)=>this.setState({ scannedPrivateKey : null })}>
                                            Retry
                                        </Button>
                                        : <div/>}
                                </div>
                                : this.state.doScan
                                    ? <div>
                                        <div style={{border:'1px solid #999',lineHeight:0}}>
                                            <QRCodeReader success={(r)=>this.setState({ scannedPrivateKey : r })}/>
                                        </div>
                                        <Button onClick={(e)=>this.setState({ doScan : false })} bsStyle="danger">
                                            Cancel
                                        </Button>
                                    </div>
                                    : <Button onClick={(e)=>this.setState({ doScan : true })}>
                                        Scan
                                    </Button>}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <h2>Smart Contract</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <p>

                            </p>
                            <ul>
                                <li>Connected to node: {this.state.smartContractNode ? 'true' : 'false'}</li>
                                <li>Status: {this.state.smartContractStatus}</li>
                                <li>Transaction: {this.state.smartContractTransaction}</li>
                                <li>Address: {this.state.smartContractAddress}</li>
                                <li>Return value: {this.state.smartContractReturn}</li>
                            </ul>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = BlockchainAccountTest;
