var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var PropTypes = React.PropTypes;

var Hint = require('./Hint');

var Grid = ReactBootstrap.Grid;

var AuthenticationError = React.createClass({

    render: function() {
        return (
            <Grid>
                <Hint style="danger">
                    <h3>Ohoo... :(</h3>
                    <p>Impossible de vous authentifier.</p>
                </Hint>
            </Grid>
        );
    }

});

module.exports = AuthenticationError;
