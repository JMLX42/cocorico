var React = require('react');
var QRCodeReader = require('qrcode-reader');

module.exports = React.createClass({

    getDefaultProps: function()
    {
        return  {
            frameRate   : 15.0,
            onSuccess   : (result) => {},
            onError     : (error) => {},
            width       : '100%',
            height      : 'auto',
            threshold   : 10
        };
    },

    componentWillMount: function()
    {
        navigator.getUserMedia = navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msGetUserMedia
            || navigator.oGetUserMedia;

        if (navigator.getUserMedia)
            navigator.getUserMedia({video : true}, this.handleVideo, this.videoError);
        else
            return this.props.onError('no media devices');

        this._qr = new QRCodeReader();
        this._qr.callback = this.handleDecode;

        this._intervalId = -1;
        this._counts = {};
    },

    componentWillUnmount: function()
    {
        if (this._intervalId > 0)
        {
            clearInterval(this._intervalId);
            this._intervalId = -1;

            // https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en
            if (this._stream.getTracks)
                this._stream.getTracks()[0].stop();
            else if (this._stream.stop)
                this._stream.stop();
            this._stream = null;
        }
    },

    handleDecode: function(result)
    {
        if (result.indexOf('error decoding QR Code') < 0)
        {

            if (!(result in this._counts))
                this._counts[result] = 1;
            else
                this._counts[result]++;

            if (this._counts[result] > this.props.threshold)
            {
                this.props.onSuccess(result);
                this._counts = {};
            }
        }
        else
        {
            // this._counts = {};
            this.props.onError(result);
        }
    },

    videoError: function(err)
    {
        console.log('video error: ' + err);
    },

    handleVideo: function(stream)
    {
        this._stream = stream;
        this.refs.qrVideo.addEventListener('loadeddata', this.handleVideoData);
        this.refs.qrVideo.src = window.URL.createObjectURL(stream);
    },

    handleVideoData: function()
    {
        if (this.refs.qrVideo.videoWidth <= 0 || this.refs.qrVideo.videoHeight <= 0)
            return;

        this.refs.qrVideo.removeEventListener('loadeddata', this.handleVideoData);

        this.refs.qrCanvas.width = Math.min(this.refs.qrVideo.videoWidth, 800);
        this.refs.qrCanvas.height = this.refs.qrCanvas.width
            * (this.refs.qrVideo.videoHeight / this.refs.qrVideo.videoWidth);

        this._intervalId = setInterval(this.capture, 1000.0 / this.props.frameRate);
    },

    capture: function()
    {
        var context = this.refs.qrCanvas.getContext('2d');
        var w = this.refs.qrCanvas.width;
        var h = this.refs.qrCanvas.height;

        context.drawImage(this.refs.qrVideo, 0, 0, w, h);
        this._qr.decode(context.getImageData(0, 0, w, h));
    },

    render: function()
    {
		return (
            <div>
                <video autoPlay ref="qrVideo" style={{width:this.props.width,height:this.props.height}}></video>
                <canvas ref="qrCanvas" id="qr-canvas" width="600" height="440" style={{display:'none'}}></canvas>
            </div>
		);
	}
});
