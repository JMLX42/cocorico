var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');
var Reflux = require('reflux');

var ProofOfVoteStore = require('../store/ProofOfVoteStore');

var VoteAction = require('../action/VoteAction');

var PropTypes = React.PropTypes;

var Button = ReactBootstrap.Button;

var ProofOfVoteDownloadButton = React.createClass({

    mixins: [
        Reflux.connect(ProofOfVoteStore, 'proofOfVote'),
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function() {
        return {
            className: 'btn btn-primary',
            onClick: (e) => null
        };
    },

    componentWillMount: function() {
        VoteAction.generateProofOfVote(this.props.billId);
    },

    onClick: function(e) {
        var pov = this.state.proofOfVote.getProofOfVoteByBillId(
            this.props.billId
        );

        // IE workaround for not supporting the download anchor attribute
        // FIXME: IE8 workaround https://jsfiddle.net/gokpfr00/41/
        if (window.navigator.msSaveBlob)
            window.navigator.msSaveBlob(new Blob([pov]), this.props.filename);

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
            !!window.navigator.msSaveBlob
                ? <Button className={this.props.className} onClick={this.onClick}>
                    <span className="icon-download"/>
                    {this.getIntlMessage('vote.DOWNLOAD_PROOF_OF_VOTE')}
                </Button>
                : <a className={this.props.className}
                    href={'data:image/svg+xml;utf8,' + pov}
                    download={this.props.filename}
                    onClick={this.onClick}>
                    <span className="icon-download"/>
                    {this.getIntlMessage('vote.DOWNLOAD_PROOF_OF_VOTE')}
                </a>
        );
    }

});

module.exports = ProofOfVoteDownloadButton;
