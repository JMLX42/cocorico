var React = require('react');

var FileSelectButton = React.createClass({

  getDefaultProps: function() {
    return {
      onSuccess: (data) => null,
      onError: (error) => null,
      className: 'btn btn-primary',
    };
  },

  onFileInputChange: function(fileInputChangeEvent) {
    var file = fileInputChangeEvent.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = (e) => {
      if (!!e.target.result) {
        this.props.onSuccess(e.target.result);
      }
    };

    reader.readAsDataURL(file);
  },

  render: function() {
    return (
      <span>
        <input type="file" name="file" id="file"
          style={{display:'none'}}
          onChange={this.onFileInputChange}/>
        <label htmlFor="file" className={this.props.className}>
          {this.props.children}
        </label>
      </span>
    );
  },

});

module.exports = FileSelectButton;
