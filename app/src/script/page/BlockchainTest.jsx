var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var Web3 = require('web3');

var greeter = require('/opt/cocorico/blockchain/greeter.json'),
    Ballot = require('/opt/cocorico/blockchain/Ballot.json');

var QRCode = require('../component/QRCode'),
    QRCodeReader = require('../component/QRCodeReader');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Button = ReactBootstrap.Button,
    Input = ReactBootstrap.Input,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab;

var BlockchainAccountTest = React.createClass({

    mixins: [
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts')
    ],

    getInitialState: function()
    {
        return {
            scannedPrivateKey           : null,
            doScan                      : false,
            availableAccounts           : [],
            transactionComplete         : false,
            createAccount               : false,
            greeterContractNode         : false,
            greeterContractStatus       : 'N/A',
            greeterContractAddress      : '',
            greeterContractReturn       : '',
            greeterContractTransaction  : '',
            ballotContractCreated       : false,
            ballotContractNode          : false,
            ballotContractStatus        : 'N/A',
            ballotContractAddress       : '',
            ballotContractReturn        : '',
            ballotContractTransaction   : ''
        }
    },

    whenTransactionMined: function(tx, callback)
    {
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));

        var check = setInterval(
            () => {
                web3.eth.getTransaction(tx, (e, r) => {
                    if (e || (r && r.blockHash))
                    {
                        clearInterval(check);
                        callback(e, r);
                    }
                })
            },
            5000
        );
    },

    componentDidMount: function()
    {
        BlockchainAccountAction.create();

        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));
        var userAccount = this.state.blockchainAccounts.getCurrentUserAccount();

        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));
        web3.eth.sendTransaction(
            {
                from    : web3.eth.accounts[0],
                to      : userAccount.address,
                value   : web3.toWei(10, "ether")
            },
            (error, result) => {
                this.whenTransactionMined(result, (err, block) => {
                    if (err)
                    {
                        console.log(err);
                        return;
                    }

                    console.log(
                        'tx from: ' + web3.eth.coinbase
                        + ' to: ' + userAccount.address
                        + ' mined in block ' + block.blockHash
                    );
                    console.log('balance:', web3.fromWei(web3.eth.getBalance(userAccount.address), 'ether').toNumber());
                    this.setState({transactionComplete:true});
                });
            }
        );

        // this.setState({transactionComplete:true});

        this.setState({availableAccounts:web3.eth.accounts});

        // this.createGreeter();
    },

    createBallot: function()
    {
        // var web3 = this._web3;
        // web3.setProvider(this.state.blockchainAccounts.getCurrentUserProvider());
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));

        var connected = web3.isConnected();

        this.setState({
            ballotContractCreated   : true,
            ballotContractStatus    : 'creating',
            ballotContractNode      : connected
        });

        // if (!connected)
        //     return;

        var ballotContract = web3.eth.contract(eval(Ballot.contracts.Ballot.abi));
        var ballotInstance = ballotContract.new(
            3, // num proposals
            {
                from    : web3.eth.accounts[0],
                data    : Ballot.contracts.Ballot.bin,
                gas     : 300000
            },
            (error, contract) => {
                if (!contract)
                    return;

                if (!contract.address)
                    this.setState({
                        ballotContractStatus      : 'contract transaction sent',
                        ballotContractTransaction : contract.transactionHash
                    });
                else
                {
                    this.setState({
                        ballotContractStatus     : 'mined',
                        ballotContractAddress    : contract.address
                    });

                    this.ballotInstance = ballotInstance;
                }
            }
        );
    },

    createGreeter: function()
    {
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider("http://cocorico.cc.test/blockchain/"));

        // web3.setProvider(this.state.blockchainAccounts.getCurrentUserProvider());

        // var web3 = this._web3;
        var _greeting = "Hello World!"
        var greeterContract = web3.eth.contract(eval(greeter.contracts.greeter.abi));
        var connected = web3.isConnected();

        this.setState({
            greeterContractStatus : 'creating',
            greeterContractNode   : connected
        });

        if (!connected)
            return;

        var greeterInstance = greeterContract.new(
            _greeting,
            {
                // from : this.state.blockchainAccounts.getCurrentUserAccount().address,
                from : web3.eth.accounts[0],
                data : greeter.contracts.greeter.bin,
                gas : 300000
            },
            (error, contract) => {
                if (!error)
                {
                    if (!contract.address)
                        this.setState({
                            greeterContractStatus      : 'contract transaction sent',
                            greeterContractTransaction : contract.transactionHash
                        });
                    else
                    {
                        this.setState({
                            greeterContractStatus     : 'mined',
                            greeterContractAddress    : contract.address,
                            greeterContractReturn     : greeterInstance.greet()
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

    vote: function(proposal)
    {
        var provider = this.state.blockchainAccounts.getCurrentUserProvider();
        var web3 = new Web3(provider);
        web3.setProvider(provider);

        var userAccount = this.state.blockchainAccounts.getCurrentUserAccount();
        var ballotContract = web3.eth.contract(eval(Ballot.contracts.Ballot.abi));
        var ballotInstance = ballotContract.at(this.state.ballotContractAddress);
        // console.log(ballotInstance);

        var voteEvent = ballotInstance.Vote();
        voteEvent.watch((err, result) => {
            console.log('vote event: ', result.args.proposal.toNumber(), result.args.user, result.args);

            this.ballotInstance.winningProposal.call((err, result) => {
                console.log('wining:', err, result.toNumber());
            });
        });

        ballotInstance.vote.sendTransaction(
            proposal,
            {
                from: userAccount.address,
                gas: 999999
            },
            (err, tx) => {
                this.whenTransactionMined(tx, (err, result) => {
                    if (err)
                    {
                        console.log(err);
                        return;
                    }

                    console.log('vote tx mined');
                    // console.log('vote result:', result.value.toNumber());

                    // this.ballotInstance.winningProposal.call((err, result) => {
                    //     console.log('wining:', err, result.toNumber());
                    // });
                });
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
                            <Tabs eventKey="1">
                                <Tab eventKey="1" title="Accounts">
                                    <Grid>
                                        <Row>
                                            <Col md={12}>
                                                <h3>Available Accounts</h3>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <ul>
                                                    {this.state.availableAccounts.map((account) => {
                                                        return <li>{account}</li>;
                                                    })}
                                                </ul>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <h3>New Account</h3>
                                            </Col>
                                        </Row>
                                        {this.state.createAccount
                                            ? <div>
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
                                            </div>
                                            : <Row>
                                                <Col md={12}>
                                                    <Button onClick={(e)=>this.setState({createAccount:true})}>
                                                        Create New Account
                                                    </Button>
                                                </Col>
                                            </Row>}
                                    </Grid>
                                </Tab>
                                <Tab eventKey="2" title="Contracts">
                                    <Grid>
                                        <Row>
                                            <Col md={12}>
                                                <h3>Greeter</h3>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <ul>
                                                    <li>Connected to node: {this.state.greeterContractNode ? 'true' : 'false'}</li>
                                                    <li>Status: {this.state.greeterContractStatus}</li>
                                                    <li>Transaction: {this.state.greeterContractTransaction}</li>
                                                    <li>Address: {this.state.greeterContractAddress}</li>
                                                    <li>Return value: {this.state.greeterContractReturn}</li>
                                                </ul>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <h3>Ballot</h3>
                                            </Col>
                                        </Row>
                                        {this.state.ballotContractCreated
                                            ? <div>
                                                <Row>
                                                    <Col md={12}>
                                                        <ul>
                                                            <li>Connected to node: {this.state.ballotContractNode ? 'true' : 'false'}</li>
                                                            <li>Status: {this.state.ballotContractStatus}</li>
                                                            <li>Transaction: {this.state.ballotContractTransaction}</li>
                                                            <li>Address: {this.state.ballotContractAddress}</li>
                                                            <li>Return value: {this.state.ballotContractReturn}</li>
                                                        </ul>
                                                    </Col>
                                                </Row>
                                                {this.state.ballotContractAddress && this.state.transactionComplete
                                                    ? <Row>
                                                        <Col md={12}>
                                                            <ul className="list-inline list-unstyled">
                                                                <li><Button onClick={(e)=>this.vote(0)}>Yes</Button></li>
                                                                <li><Button onClick={(e)=>this.vote(1)}>No</Button></li>
                                                                <li><Button onClick={(e)=>this.vote(2)}>Blank</Button></li>
                                                            </ul>
                                                        </Col>
                                                    </Row>
                                                    : <div/>}
                                            </div>
                                            : <div>
                                                <Row>
                                                    <Col md={12}>
                                                        <Button onClick={this.createBallot}>Create New Ballot</Button>
                                                        <p>or join an existing ballot:</p>
                                                        <Input type="text" placeholder="address" buttonAfter={<Button onClick={this.createBallot}>Join</Button>}/>
                                                    </Col>
                                                </Row>
                                            </div>}
                                    </Grid>
                                </Tab>
                            </Tabs>
                        </Col>
                    </Row>
                </Grid>
            </div>
		);
	}
});

module.exports = BlockchainAccountTest;
