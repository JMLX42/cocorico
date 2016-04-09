var React = require('react');
var PropTypes = React.PropTypes;

var QRCode = require('./QRCode');

var ProofOfVote = React.createClass({

    render: function() {
        return (
            <QRCode data="0x42424242"/>
        );
    }

});

module.exports = ProofOfVote;
