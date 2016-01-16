var React = require('react');
var pace = require('pace');
var jquery = require('jquery');

var Pace = React.createClass({
    componentDidMount: function()
    {
        jquery(document).ajaxStart(function() { pace.restart(); });

        pace.start({
            ajax: {
                trackMethods: ['GET', 'POST']
            },
            restartOnPushState: false
        });
    },

    render: function()
    {
        return <div />;
    }
});

module.exports = Pace;
