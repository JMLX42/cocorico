require('../style/button.less');
require('babel-polyfill');

var React = require('react');
var ReactDOM = require('react-dom');
var ReactBootstrap = require('react-bootstrap');

var Button = ReactBootstrap.Button;

ReactDOM.render(
    <Button>Vote</Button>,
    document.getElementById('app')
);
