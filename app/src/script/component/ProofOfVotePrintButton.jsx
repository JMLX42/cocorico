var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');
var PrintHTMLElement = require("print-html-element");

var ProofOfVoteStore = require('../store/ProofOfVoteStore');

var VoteAction = require('../action/VoteAction');

var ProofOfVote = require('./ProofOfVote');

var PropTypes = React.PropTypes;

var Button = ReactBootstrap.Button;

var ProofOfVotePrintButton = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(ProofOfVoteStore, 'proofOfVote')
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

    componentWillMount: function() {
        VoteAction.generateProofOfVote(this.props.billId);
    },

    onClick: function(e) {
        PrintHTMLElement.printElement(
            document.getElementById(this.state.elementId),
            { printMode: 'popup' }
        );

        this.props.onClick(e);
    },

    render: function() {
        var pov = this.state.proofOfVote.getProofOfVoteByBillId(
            this.props.billId
        );

        if (!pov) {
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
                    {this.getIntlMessage('vote.PRINT_PROOF_OF_VOTE')}
                </Button>
                <div className="visible-print-block" id={this.state.elementId}
                    style={{width:'50%'}}>
                    <ProofOfVote billId={this.props.billId}/>
                </div>
            </span>
        );
    }

});

module.exports = ProofOfVotePrintButton;
