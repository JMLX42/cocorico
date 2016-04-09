var React = require('react');
var qrcode = require('qrcode-npm')

module.exports = React.createClass({

    getDefaultProps: function() {
        return {
            version: 4,
            correctionLevel: 'M',
            cellSize: 8
        };
    },

    render: function()
    {
        var qr = qrcode.qrcode(this.props.version, this.props.correctionLevel);

        qr.addData(this.props.data);
        qr.make();

        var imgTag = qr.createImgTag(this.props.cellSize);

		return (
            <div style={{display:'inline-block'}} dangerouslySetInnerHTML={{__html: imgTag}}></div>
		);
	}
});
