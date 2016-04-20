var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var QRCodeReader = require('qrcode-reader');
var Base64 = require('js-base64').Base64;

var QRCodeReader = require('./QRCodeReader');

var PropTypes = React.PropTypes;

var Modal = ReactBootstrap.Modal,
    Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col;

var ProofOfVoteReader = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getInitialState: function() {
        return {
            readFromVideo: false
        };
    },

    getDefaultProps: function() {
        return {
            onSuccess: (data) => null,
            onError: (error) => null,
            onCancel: () => null
        };
    },

    handleFileDecode: function(result) {
        if (result.indexOf('error decoding QR Code') < 0) {
            this.props.onSuccess(result);
        }
        else {
            this.props.onError(result);
        }
    },

    qrCodeReaderSuccess: function(data) {
        // FIXME: actual check of the proof of vote content and format
        if (data == '0x42424242')
            this.props.onSuccess(data);
    },

    onFileInputChange: function(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }

        var reader = new FileReader();
        reader.onload = (e) => {
            var svg = Base64.decode(e.target.result.substr(26));
            var pof = svg.match(/<desc>(.*)<\/desc>/);

            if (pof[1] == '0x42424242') {
                this.props.onSuccess(pof[1]);
            }
        };

        reader.readAsDataURL(file);
    },

    renderReadMethodSelection: function() {
        return (
            <ButtonToolbar className="btn-toolbar-vertical">
                <Button className="btn btn-primary"
                    onClick={(e)=>this.setState({readFromVideo:true})}>
                    {this.getIntlMessage('proofOfVoteReader.SCAN_PRINTED_FILE')}
                </Button>
                <input type="file" name="file" id="file"
                    style={{display:'none'}}
                    onChange={this.onFileInputChange}/>
                <label htmlFor="file" className="btn btn-primary">
                    {this.getIntlMessage('proofOfVoteReader.SEND_DOWNLOADED_FILE')}
                </label>
            </ButtonToolbar>
        );
    },

    render: function() {
        return (
            <Modal show={true}>
                <Modal.Header>
                    {this.getIntlMessage('proofOfVoteReader.PROVIDE_PROOF_OF_VOTE')}
                </Modal.Header>
                <Modal.Body>
                    {!this.state.readFromVideo
                        ? this.renderReadMethodSelection()
                        : <QRCodeReader onSuccess={this.qrCodeReaderSuccess}/>}
                </Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <Button onClick={(e)=>this.props.onCancel()}
                            className="pull-right">
                            {this.getIntlMessage('proofOfVoteReader.CANCEL')}
                        </Button>
                        {this.state.readFromVideo
                            ? <Button bsStyle="link" className="pull-right"
                                onClick={(e)=>this.setState({readFromVideo:false})}>
                                {this.getIntlMessage('proofOfVoteReader.BACK')}
                            </Button>
                            : <span/>}
                    </ButtonToolbar>
                </Modal.Footer>
            </Modal>
        );
    }

});

module.exports = ProofOfVoteReader;
