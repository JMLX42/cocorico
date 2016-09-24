var React = require('react');

module.exports = React.createClass({

  getDefaultProps: function() {
    return {
      interval: 1000,
      onComplete: () => {},
      format: (c) => c,
    };
  },

  getInitialState: function() {
    return {
      count: this.props.count,
    };
  },

  componentDidMount: function() {
    this._interval = setInterval(
      () => {
        var count = this.state.count - 1;

        this.setState({count:count});

        if (count <= 0) {
          count = 0;
          clearInterval(this._interval);
          this.props.onComplete();
        }
      },
      this.props.interval
    );
  },

  componentWillUnmount: function() {
    clearInterval(this._interval);
  },

  render: function() {
    return (
      <span>
        {this.props.format(this.state.count)}
      </span>
		);
  },
});
