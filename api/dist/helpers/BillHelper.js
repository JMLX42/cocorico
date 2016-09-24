'use strict';

var bcrypt = require('bcrypt');

exports.billIsReadable = function (bill, req, checkAuthor) {
  return ['draft'].indexOf(bill.status) < 0 || !checkAuthor && req.isAuthenticated() && bcrypt.compareSync(req.user.sub, bill.author);
};

exports.filterReadableBills = function (bills, req, checkAuthor) {
  var filtered = [];

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = bills[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var bill = _step.value;

      if (exports.billIsReadable(bill, req, checkAuthor)) filtered.push(bill);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return filtered;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL0JpbGxIZWxwZXIuanMiXSwibmFtZXMiOlsiYmNyeXB0IiwicmVxdWlyZSIsImV4cG9ydHMiLCJiaWxsSXNSZWFkYWJsZSIsImJpbGwiLCJyZXEiLCJjaGVja0F1dGhvciIsImluZGV4T2YiLCJzdGF0dXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJjb21wYXJlU3luYyIsInVzZXIiLCJzdWIiLCJhdXRob3IiLCJmaWx0ZXJSZWFkYWJsZUJpbGxzIiwiYmlsbHMiLCJmaWx0ZXJlZCIsInB1c2giXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsU0FBU0MsUUFBUSxRQUFSLENBQWI7O0FBRUFDLFFBQVFDLGNBQVIsR0FBeUIsVUFBU0MsSUFBVCxFQUFlQyxHQUFmLEVBQW9CQyxXQUFwQixFQUFpQztBQUN4RCxTQUFPLENBQUMsT0FBRCxFQUFVQyxPQUFWLENBQWtCSCxLQUFLSSxNQUF2QixJQUFpQyxDQUFqQyxJQUNILENBQUNGLFdBQUQsSUFBZ0JELElBQUlJLGVBQUosRUFBaEIsSUFBeUNULE9BQU9VLFdBQVAsQ0FBbUJMLElBQUlNLElBQUosQ0FBU0MsR0FBNUIsRUFBaUNSLEtBQUtTLE1BQXRDLENBRDdDO0FBRUQsQ0FIRDs7QUFLQVgsUUFBUVksbUJBQVIsR0FBOEIsVUFBU0MsS0FBVCxFQUFnQlYsR0FBaEIsRUFBcUJDLFdBQXJCLEVBQWtDO0FBQzlELE1BQUlVLFdBQVcsRUFBZjs7QUFEOEQ7QUFBQTtBQUFBOztBQUFBO0FBRzlELHlCQUFpQkQsS0FBakI7QUFBQSxVQUFTWCxJQUFUOztBQUNFLFVBQUlGLFFBQVFDLGNBQVIsQ0FBdUJDLElBQXZCLEVBQTZCQyxHQUE3QixFQUFrQ0MsV0FBbEMsQ0FBSixFQUNFVSxTQUFTQyxJQUFULENBQWNiLElBQWQ7QUFGSjtBQUg4RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQU85RCxTQUFPWSxRQUFQO0FBQ0QsQ0FSRCIsImZpbGUiOiJCaWxsSGVscGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGJjcnlwdCA9IHJlcXVpcmUoJ2JjcnlwdCcpO1xuXG5leHBvcnRzLmJpbGxJc1JlYWRhYmxlID0gZnVuY3Rpb24oYmlsbCwgcmVxLCBjaGVja0F1dGhvcikge1xuICByZXR1cm4gWydkcmFmdCddLmluZGV4T2YoYmlsbC5zdGF0dXMpIDwgMFxuXHRcdHx8ICghY2hlY2tBdXRob3IgJiYgcmVxLmlzQXV0aGVudGljYXRlZCgpICYmIGJjcnlwdC5jb21wYXJlU3luYyhyZXEudXNlci5zdWIsIGJpbGwuYXV0aG9yKSk7XG59XG5cbmV4cG9ydHMuZmlsdGVyUmVhZGFibGVCaWxscyA9IGZ1bmN0aW9uKGJpbGxzLCByZXEsIGNoZWNrQXV0aG9yKSB7XG4gIHZhciBmaWx0ZXJlZCA9IFtdO1xuXG4gIGZvciAodmFyIGJpbGwgb2YgYmlsbHMpXG4gICAgaWYgKGV4cG9ydHMuYmlsbElzUmVhZGFibGUoYmlsbCwgcmVxLCBjaGVja0F1dGhvcikpXG4gICAgICBmaWx0ZXJlZC5wdXNoKGJpbGwpO1xuXG4gIHJldHVybiBmaWx0ZXJlZDtcbn1cbiJdfQ==