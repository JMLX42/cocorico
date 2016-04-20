var React = require('react');
var getUserMedia = require('getusermedia');

var PropTypes = React.PropTypes;

var LoadingIndicator = require('./LoadingIndicator'),
    Hint = require('./Hint');

var CameraVideo = React.createClass({

    getInitialState: function() {
        return {
            videoReady: false,
            error: null,
            numDevices: 0
        };
    },

    getDefaultProps: function() {
        return  {
            width: '100%',
            height: 'auto',
            onVideoReady: (e) => null,
            onVideoStop: (e) => null,
            onError: (e) => null
        };
    },

    getCameraSourceIds: function(callback) {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            return navigator.mediaDevices.enumerateDevices()
                .then((devices) => callback(
                    null,
                    devices.filter((device) => device.kind == 'videoinput')
                        .map((device) => device.deviceId)
                ))
                .catch(callback);
        }

        return callback('error');
    },

    componentWillMount: function() {
        this._switchedCamera = false;

        this.startVideo();
    },

    componentWillUnmount: function() {
        this.stopVideo();
    },

    startVideo: function() {
        this.getCameraSourceIds((err, ids) => {
            if (err) {
                this.setState({error:err});
                this.props.onError(err);
                return;
            }

            this.setState({numDevices:ids.length});

            var deviceId = this._switchedCamera
                ? ids[0]
                : ids[ids.length - 1];

            getUserMedia(
                {video : {deviceId: deviceId}, audio: false},
                (err, stream) => {
                    if (err) {
                        this.setState({error:err});
                        this.props.onError(err);
                        return;
                    }

                    this._stream = stream;
                    this.refs.video.addEventListener('loadeddata', this.handleVideoData);
                    this.refs.video.src = window.URL.createObjectURL(stream);
                }
            );
        });
    },

    stopVideo: function() {
        if (this._stream) {
            // https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en
            if (this._stream.getTracks) {
                this._stream.getTracks()[0].stop();
            }
            else if (this._stream.stop) {
                this._stream.stop();
            }
            this._stream = null;

            this.refs.video.removeEventListener('loadeddata', this.handleVideoData);
            this.setState({videoReady:false});

            this.props.onVideoStop();
        }
    },

    handleVideoData: function(e) {
        if (this.refs.video.videoWidth <= 0
            || this.refs.video.videoHeight <= 0)
            return;

        this.refs.video.removeEventListener('loadeddata', this.handleVideoData);
        this.props.onVideoReady(e);
        this.setState({videoReady:true});
    },

    switchVideoSource: function() {
        this.stopVideo();
        this._switchedCamera = !this._switchedCamera;
        this.startVideo();
    },

    render: function() {
		return (
            <div>
                {this.state.error
                    ? <Hint style="danger">
                        <h3>
                            Impossible d'accéder à votre webcam
                        </h3>
                        <p>
                            Les raisons possibles sont les suivantes :
                        </p>
                        <ul>
                            <li>aucune webcam n'est branchée/installée ;</li>
                            <li>votre navigateur n'est pas compatible ;</li>
                            <li>une autre application utilise déjà votre webcam.</li>
                        </ul>
                    </Hint>
                    : <span/>}
                {!this.state.error && !this.state.videoReady
                    ? <LoadingIndicator/>
                : <span/>}
                {!this.state.error
                    ? <div style={{position:'relative'}}>
                        <video autoPlay ref="video" style={{
                            width: this.props.width,
                            height: this.props.height,
                            display: this.state.videoReady ? 'initial' : 'none'
                        }}/>
                        {this.state.videoReady && this.state.numDevices > 1
                            ? <div className="icon-switch_video btn-switch-video" onClick={this.switchVideoSource}/>
                            : <span/>}
                    </div>
                    : <span/>}
            </div>
		);
	}

});

module.exports = CameraVideo;
