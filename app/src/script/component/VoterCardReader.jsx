var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var QRCodeReader = require('qrcode-reader');
var Base64 = require('js-base64').Base64;

var QRCodeReader = require('./QRCodeReader');

var BlockchainAccountAction = require('../action/BlockchainAccountAction');

var PropTypes = React.PropTypes;

var ConfigStore = require('../store/ConfigStore');

var Button = ReactBootstrap.Button,
    ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Col = ReactBootstrap.Col,
    Row = ReactBootstrap.Row;

var VoterCardReader = React.createClass({

    mixins: [
        ReactIntl.IntlMixin,
        Reflux.connect(ConfigStore, 'config')
    ],

    getInitialState: function() {
        return {
            readFromVideo: false
        };
    },

    getDefaultProps: function() {
        return {
            onSuccess: (data) => null,
            onError: (error) => null
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
        BlockchainAccountAction.import(this.props.voteId, data);
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

            var data = pof[1];

            if (!!data) {
                BlockchainAccountAction.import(this.props.voteId, data);
                this.props.onSuccess(data);
            }
        };

        reader.readAsDataURL(file);
    },

    renderReadMethodSelection: function() {
        return (
            <Row className="voter-card-reader">
                <ButtonToolbar>
                    <Col xs={12} sm={this.state.config.capabilities.vote_card.download ? 6 : 12}>
                        {this.state.config.capabilities.vote_card.scan
                            ? <Button className="btn btn-primary"
                                onClick={(e)=>this.setState({readFromVideo:true})}>
                                {this.getIntlMessage('proofOfVoteReader.SCAN_PRINTED_FILE')}
                            </Button>
                            : <span/>}
                    </Col>
                    <Col xs={12} sm={this.state.config.capabilities.vote_card.scan ? 6 : 12}>
                        {this.state.config.capabilities.vote_card.download
                            ? <span>
                                <input type="file" name="file" id="file"
                                    style={{display:'none'}}
                                    onChange={this.onFileInputChange}/>
                                <label htmlFor="file" className="btn btn-primary">
                                    {this.getIntlMessage('proofOfVoteReader.SEND_DOWNLOADED_FILE')}
                                </label>
                            </span>
                            : <span/>}
                    </Col>
                </ButtonToolbar>
            </Row>
        );
    },

    render: function() {
        return (
            !this.state.readFromVideo
                ? this.renderReadMethodSelection()
                : <QRCodeReader onSuccess={this.qrCodeReaderSuccess}/>
        );
    }

});

module.exports = VoterCardReader;
