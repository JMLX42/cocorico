var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var QRCode = require('./QRCode'),
    QRCodeReader = require('./QRCodeReader');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

module.exports = React.createClass({

    mixins: [
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts')
    ],

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
            <div>
                <QRCode type={9} level="Q" text={account.private}/>
                <QRCodeReader success={(result)=>console.log(result == account.private)}/>
            </div>
		);
	}
});
