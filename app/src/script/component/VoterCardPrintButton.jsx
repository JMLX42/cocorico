var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var PrintHTMLElement = require("print-html-element");

var BlockchainAccountStore = require('../store/BlockchainAccountStore');

var VoteAction = require('../action/VoteAction');

var VoterCard = require('./VoterCard');

var PropTypes = React.PropTypes;

var Button = ReactBootstrap.Button;

var VoterCardPrintButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(BlockchainAccountStore, 'blockchainAccounts')
    ],

    getDefaultProps: function() {
        return {
            onClick: (e) => null
        };
    },

    getInitialState: function() {
        return {
            elementId: 'proof-of-vote-' + this.props.billId
        };
    },

    onClick: function(e) {
        PrintHTMLElement.printElement(
            document.getElementById(this.state.elementId),
            { printMode: 'popup' }
        );

        this.props.onClick(e);
    },

    render: function() {
        var voterCard = this.state.blockchainAccounts.getVoterCardByBillId(
            this.props.billId
        );

        if (!voterCard) {
            return null;
        }

        return (
            <span>
                <Button
                    className={this.props.className
                        ? this.props.className
                        : 'btn btn-primary'}
                    onClick={this.onClick}>
                    <span className="icon-printer"/>
                    {this.getIntlMessage('vote.PRINT_VOTER_CARD')}
                </Button>
                <div className="visible-print-block" id={this.state.elementId}
                    style={{width:'50%'}}>
                    <VoterCard billId={this.props.billId}/>
                </div>
            </span>
        );
    }

});

module.exports = VoterCardPrintButton;
