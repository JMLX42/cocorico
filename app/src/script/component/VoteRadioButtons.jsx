var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var classNames = require('classnames');

var Button = ReactBootstrap.Button;
var FormattedMessage = ReactIntl.FormattedMessage;


var VoteRadioButtons = React.createClass({

    mixins: [
        ReactIntl.IntlMixin
    ],

    getDefaultProps: function() {
        return {
            onVote: (e, ballotValue) => null,
            vote: null,
        };
    },

    render: function() {
        var labels = this.props.vote.labels;

        return (
            <form>
                <ul className="list-unstyled" >
                    {labels.map((label, index) => { return (
                        <li>
                            <input type="radio" name="ballot" value={index}
                                onChange={(e) => this.setState({ballotValue: index})}/>
                            &nbsp;&nbsp;
                            <FormattedMessage
                                message={this.getIntlMessage('vote.VOTE_RADIO_BUTTON')}
                                value={label}/>
                        </li>
                    ); })}
                </ul>
                <Button
                    className="btn-vote btn-primary"
                    onClick={(e) => this.props.onVote(e, this.state.ballotValue)}>
                        {this.getIntlMessage('vote.VOTE_VALIDATE')}
                </Button>
            </form>
        );
    }
});

module.exports = VoteRadioButtons;
