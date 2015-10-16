var Router = require('./Router');

ReactRouter.run(Router, function (handler) {
    React.render(React.createElement(handler, {}), document.body);
});
