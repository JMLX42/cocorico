var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');

var VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var VoteResultPieChart = require('./VoteResultPieChart'),
    VoteResultPerDateLineChart = require('./VoteResultPerDateLineChart');

var Grid = ReactBootstrap.Grid,
    Row = ReactBootstrap.Row,
    Col = ReactBootstrap.Col,
    Tabs = ReactBootstrap.Tabs,
    Tab = ReactBootstrap.Tab,
    Button = ReactBootstrap.Button;

module.exports = React.createClass({

    mixins : [
        ReactIntl.IntlMixin,
        Reflux.connect(VoteStore, 'votes')
    ],

    componentWillMount : function()
    {
        VoteAction.showTextVoteResult(this.props.textId);
    },

    renderChildren: function()
    {
        var result = this.state.votes
            ? this.state.votes.getVoteResultByTextId(this.props.textId)
            : null;

        var resultPerDate = this.state.votes
            ? this.state.votes.getVoteResultPerDateByTextId(this.props.textId)
            : null;

        if (!result)
            return (
                <Row>
                    <Col md={12}>
                        <p>Chargement...</p>
                    </Col>
                </Row>
            );

        return (
            <div>
                <Row>
                    <Col md={12}>
                        <ul className="list-unstyled list-inline">
                            <li>
                                {result.yes + result.no + result.blank} votes
                            </li>
                            <li>
                                <span className="cocorico-blue">
                                    {result.yes} votes 'pour'
                                </span>
                            </li>
                            <li>
                                <span className="cocorico-red">
                                    {result.no} votes 'contre'
                                </span>
                            </li>
                            <li>
                                <span className="cocorico-dark-grey">
                                    {result.blank} votes 'blanc'
                                </span>
                            </li>
                        </ul>
                    </Col>
                    <Col md={12}>
                        <VoteResultPieChart result={result}/>
                    </Col>
                    <Col md={12}>
                        {resultPerDate
                            ? <VoteResultPerDateLineChart result={resultPerDate}/>
                            : <div/>}
                    </Col>
                </Row>
            </div>
        );
    },

    render: function()
    {
        return (
            <Grid>
                <Row className="section">
                    <Col md={12}>
                        <h2 className="section-title">Résultat du vote</h2>
                    </Col>
                </Row>
                {this.renderChildren()}
            </Grid>
        );
    }
});
