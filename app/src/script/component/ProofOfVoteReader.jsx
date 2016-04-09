var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');

var QRCodeReader = require('./QRCodeReader');

var PropTypes = React.PropTypes;

var Modal = ReactBootstrap.Modal,
    Button = ReactBootstrap.Button;

var ProofOfVoteReader = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function() {
        return {
            onSuccess: (data) => null,
            onError: (error) => null,
            onCancel: () => null
        };
    },

    qrCodeReaderSuccess: function(data) {
        // FIXME: actual check of the proof of vote content and format
        if (data == '0x42424242')
            this.props.onSuccess(data);
    },

    render: function() {
        return (
            <Modal show={true}>
                <Modal.Header>
                    {this.getIntlMessage('vote.SCAN_PROOF_OF_VOTE')}
                </Modal.Header>
                <Modal.Body>
                    <QRCodeReader onSuccess={this.qrCodeReaderSuccess}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={(e)=>this.props.onCancel()}>
                        Annuler
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

});

module.exports = ProofOfVoteReader;
