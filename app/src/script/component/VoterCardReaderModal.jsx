var React = require('react');
var ReactIntl = require('react-intl');
var ReactBootstrap = require('react-bootstrap');

var VoterCardReader = require('./VoterCardReader');

var Modal = ReactBootstrap.Modal,
    ButtonToolbar = ReactBootstrap.ButtonToolbar,
    Button = ReactBootstrap.Button;

var PropTypes = React.PropTypes;

var VoterCardReaderModal = React.createClass({

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

    getInitialState: function() {
        return {
            readFromVideo: false
        };
    },

    render: function() {
        return (
            <Modal show={true}>
                <Modal.Header>
                    {this.getIntlMessage('proofOfVoteReader.PROVIDE_VOTER_CARD')}
                </Modal.Header>
                <Modal.Body>
                    <VoterCardReader onSuccess={this.props.onSuccess}
                        onError={this.props.onError}/>
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

module.exports = VoterCardReaderModal;
