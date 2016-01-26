var React = require('react');
var qrcode = require('qrcode-npm')

module.exports = React.createClass({

    render: function()
    {
        var qr = qrcode.qrcode(this.props.type, this.props.level);

        qr.addData(this.props.text);
        qr.make();

		return (
            <div style={{display: 'inline-block'}} dangerouslySetInnerHTML={{__html: qr.createImgTag(4)}}></div>
		);
	}
});
