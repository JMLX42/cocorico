var React = require('react');
var QRCodeDecoder = require('qrcode-reader');

var CameraVideo = require('./CameraVideo');

var QRCodeReader = React.createClass({

  getInitialState: function() {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
    };
  },

  getDefaultProps: function() {
    return {
      onSuccess: (data) => null,
      onError: (error) => null,
      captureRate: 10.0,
      decodeThreshold: 10,
    };
  },

  componentWillMount: function() {
    this._qrCodeDecoder = new QRCodeDecoder();
    this._qrCodeDecoder.callback = this.handleDecode;
    this._qrDecodeSuccessCount = {};
  },

  componentWillUnmount: function() {
    this.stopReadingFromVideo();

    this._qrCodeDecoder = null;
  },

  handleDecode: function(result) {
    if (result.indexOf('error decoding QR Code') < 0) {
      if (!(result in this._qrDecodeSuccessCount))
        this._qrDecodeSuccessCount[result] = 1;
      else
        this._qrDecodeSuccessCount[result]++;

      if (this._qrDecodeSuccessCount[result] > this.props.decodeThreshold) {
        this.props.onSuccess(result);
        this._qrDecodeSuccessCount = {};
      }
    } else {
      // this._qrDecodeSuccessCount = {};
      this.props.onError(result);
    }
  },

  decodeQRCode: function() {
    var context = this.refs.videoCanvas.getContext('2d');
    var w = this.refs.videoCanvas.width;
    var h = this.refs.videoCanvas.height;

    this._qrCodeDecoder.decode(context.getImageData(0, 0, w, h));
  },

  startReadingFromVideo: function() {
    clearInterval(this._captureInterval);
  },

  stopReadingFromVideo: function() {
    clearInterval(this._captureInterval);
    this._captureInterval = null;
  },

  captureVideoFrame: function(video) {
    var w = video.offsetWidth;
    var h = video.offsetHeight;

    if (!!w && !!h) {
      var canvasWidth = Math.min(640, w);
      var canvasHeight = h * (canvasWidth / w);

      this.setState({
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
      });

      var context = this.refs.videoCanvas.getContext('2d');

      context.drawImage(video, 0, 0, w, h);
    }
  },

  onVideoReady: function(e) {
    this.stopReadingFromVideo();

    this._captureInterval = setInterval(
      () => {
        this.captureVideoFrame(e.target);
        this.decodeQRCode();
      },
      1000.0 / this.props.captureRate
    );
  },

  render: function() {
    return (
      <div>
        <CameraVideo ref="cameraVideo"
          onVideoReady={this.onVideoReady}
          onVideoStop={this.stopReadingFromVideo}/>
        <canvas ref="videoCanvas" width={this.state.canvasWidth}
          height={this.state.canvasHeight}
          style={{display:'none'}}/>
      </div>
    );
  },

});

module.exports = QRCodeReader;
