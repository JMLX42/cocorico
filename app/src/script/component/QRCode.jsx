var React = require('react');
var qrcode = require('qrcode-npm')

module.exports = React.createClass({

    render: function()
    {
        var qr = qrcode.qrcode(this.props.type, this.props.level);

        qr.addData(this.props.bill);
        qr.make();

        var imgTag = qr.createImgTag(4);

        imgTag = imgTag.replace(/<img src="(.*)" width=".*" height=".*"\/>/, '<img src="$1" style="max-width:100%;width:100%;height:100%"/>');

		return (
            <div style={{display:'inline-block'}} dangerouslySetInnerHTML={{__html: imgTag}}></div>
		);
	}
});
