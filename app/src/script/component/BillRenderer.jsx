var React = require('react');
var classNames = require('classnames');

var ForceAuthMixin = require('../mixin/ForceAuthMixin');

var BillAction = require('../action/BillAction');

var LinkWithTooltip = require('./LinkWithTooltip'),
    LikeButtons = require('./LikeButtons');

module.exports = React.createClass({

    mixins: [
        ForceAuthMixin
    ],

    getInitialState: function()
    {
        return {
            activePart : null
        };
    },

    getDefaultProps: function()
    {
        return {
            editable: true
        };
    },

    renderHeader: function(title, level)
    {
        switch (level) {
            case 1:
                return (<h1>{title}</h1>);
            case 2:
                return (<h2>{title}</h2>);
            case 3:
                return (<h3>{title}</h3>);
            case 4:
                return (<h4>{title}</h4>);
            case 5:
                return (<h5>{title}</h5>);
            case 6:
                return (<h6>{title}</h6>);
        }
    },

    getSourceByURL: function(url)
    {
        for (var source of this.props.sources)
            if (source.url == url)
                return source;

        return null;
    },

    renderContent: function(content)
    {
        return content.map((para) => {
            return (
                <p>
                    {para.map((part) => {
                        if (typeof part == "string")
                            return part;
                        if (typeof part == "object" && part[0] == "link")
                        {
                            var source = this.getSourceByURL(part[1].href);

                            return (
                                <LinkWithTooltip href={part[1].href}
                                    tooltip={source.title + ' (' + (source.score > 0 ? '+' + source.score : source.score) + ')'}
                                    target="_blank">
                                    {part[2]}
                                </LinkWithTooltip>
                            );
                        }
                    })}
                </p>
            );
        });
    },

    renderPart: function(part)
    {
        return (
            <div onMouseEnter={(e)=>this.isAuthenticated() && this.props.editable && this.setState({activePart:part})}
                onMouseLeave={(e)=>this.isAuthenticated() && this.props.editable && this.setState({activePart:null})}
                className={classNames({
                    'bill-part'          : true,
                    'bill-part-active'   : !this.props.editable || this.state.activePart == part,
                    'bill-part-inactive' : !!this.state.activePart && this.state.activePart != part
                })}>
                {this.renderHeader(part.title, part.level)}
                <LikeButtons likeAction={BillAction.likeBillPart} resource={part} editable={this.props.editable}
                    scoreFormat={(score) => score > 0 ? '+' + score : score}/>
                {this.renderContent(JSON.parse(part.content))}
            </div>
        );
    },

    render: function()
    {
		return (
            <div>
                {this.props.bill.parts.map((part) => this.renderPart(part))}
            </div>
        );
	}
});
