'use strict';

var keystone = require('keystone');
var transform = require('model-transform');
var srs = require('secure-random-string');

var Types = keystone.Field.Types;

var App = new keystone.List('App', {
  map: { name: 'title' }
});

App.add({
  title: { type: String, required: true, initial: true },
  secret: { type: Types.Key, required: true, default: function _default() {
      return srs(32).toLowerCase();
    } },
  validURLs: { type: Types.TextArray }
});

App.relationship({ path: 'votes', ref: 'Vote', refPath: 'app' });
App.relationship({ path: 'accessTokens', ref: 'AccessToken', refPath: 'client' });

App.schema.methods.isValidURL = function (url) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = this.validURLs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var validURL = _step.value;

      if (url.indexOf(validURL) === 0) {
        return true;
      }
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

  return false;
};

transform.toJSON(App);

App.defaultColumns = 'title, key, secret';
App.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvQXBwLmpzIl0sIm5hbWVzIjpbImtleXN0b25lIiwicmVxdWlyZSIsInRyYW5zZm9ybSIsInNycyIsIlR5cGVzIiwiRmllbGQiLCJBcHAiLCJMaXN0IiwibWFwIiwibmFtZSIsImFkZCIsInRpdGxlIiwidHlwZSIsIlN0cmluZyIsInJlcXVpcmVkIiwiaW5pdGlhbCIsInNlY3JldCIsIktleSIsImRlZmF1bHQiLCJ0b0xvd2VyQ2FzZSIsInZhbGlkVVJMcyIsIlRleHRBcnJheSIsInJlbGF0aW9uc2hpcCIsInBhdGgiLCJyZWYiLCJyZWZQYXRoIiwic2NoZW1hIiwibWV0aG9kcyIsImlzVmFsaWRVUkwiLCJ1cmwiLCJ2YWxpZFVSTCIsImluZGV4T2YiLCJ0b0pTT04iLCJkZWZhdWx0Q29sdW1ucyIsInJlZ2lzdGVyIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLFdBQVdDLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBSUMsWUFBWUQsUUFBUSxpQkFBUixDQUFoQjtBQUNBLElBQUlFLE1BQU1GLFFBQVEsc0JBQVIsQ0FBVjs7QUFFQSxJQUFJRyxRQUFRSixTQUFTSyxLQUFULENBQWVELEtBQTNCOztBQUVBLElBQUlFLE1BQU0sSUFBSU4sU0FBU08sSUFBYixDQUFrQixLQUFsQixFQUF5QjtBQUNqQ0MsT0FBSyxFQUFFQyxNQUFNLE9BQVI7QUFENEIsQ0FBekIsQ0FBVjs7QUFJQUgsSUFBSUksR0FBSixDQUFRO0FBQ05DLFNBQU8sRUFBRUMsTUFBTUMsTUFBUixFQUFnQkMsVUFBVSxJQUExQixFQUFnQ0MsU0FBUyxJQUF6QyxFQUREO0FBRU5DLFVBQVEsRUFBRUosTUFBTVIsTUFBTWEsR0FBZCxFQUFtQkgsVUFBVSxJQUE3QixFQUFtQ0ksU0FBUztBQUFBLGFBQU1mLElBQUksRUFBSixFQUFRZ0IsV0FBUixFQUFOO0FBQUEsS0FBNUMsRUFGRjtBQUdOQyxhQUFXLEVBQUVSLE1BQU1SLE1BQU1pQixTQUFkO0FBSEwsQ0FBUjs7QUFNQWYsSUFBSWdCLFlBQUosQ0FBaUIsRUFBRUMsTUFBTSxPQUFSLEVBQWlCQyxLQUFLLE1BQXRCLEVBQThCQyxTQUFTLEtBQXZDLEVBQWpCO0FBQ0FuQixJQUFJZ0IsWUFBSixDQUFpQixFQUFFQyxNQUFNLGNBQVIsRUFBd0JDLEtBQUssYUFBN0IsRUFBNENDLFNBQVMsUUFBckQsRUFBakI7O0FBRUFuQixJQUFJb0IsTUFBSixDQUFXQyxPQUFYLENBQW1CQyxVQUFuQixHQUFnQyxVQUFTQyxHQUFULEVBQWM7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDNUMseUJBQXFCLEtBQUtULFNBQTFCLDhIQUFxQztBQUFBLFVBQTVCVSxRQUE0Qjs7QUFDbkMsVUFBSUQsSUFBSUUsT0FBSixDQUFZRCxRQUFaLE1BQTBCLENBQTlCLEVBQWlDO0FBQy9CLGVBQU8sSUFBUDtBQUNEO0FBQ0Y7QUFMMkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFNNUMsU0FBTyxLQUFQO0FBQ0QsQ0FQRDs7QUFTQTVCLFVBQVU4QixNQUFWLENBQWlCMUIsR0FBakI7O0FBRUFBLElBQUkyQixjQUFKLEdBQXFCLG9CQUFyQjtBQUNBM0IsSUFBSTRCLFFBQUoiLCJmaWxlIjoiQXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGtleXN0b25lID0gcmVxdWlyZSgna2V5c3RvbmUnKTtcbnZhciB0cmFuc2Zvcm0gPSByZXF1aXJlKCdtb2RlbC10cmFuc2Zvcm0nKTtcbnZhciBzcnMgPSByZXF1aXJlKCdzZWN1cmUtcmFuZG9tLXN0cmluZycpO1xuXG52YXIgVHlwZXMgPSBrZXlzdG9uZS5GaWVsZC5UeXBlcztcblxudmFyIEFwcCA9IG5ldyBrZXlzdG9uZS5MaXN0KCdBcHAnLCB7XG4gIG1hcDogeyBuYW1lOiAndGl0bGUnIH0sXG59KTtcblxuQXBwLmFkZCh7XG4gIHRpdGxlOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUsIGluaXRpYWw6IHRydWUgfSxcbiAgc2VjcmV0OiB7IHR5cGU6IFR5cGVzLktleSwgcmVxdWlyZWQ6IHRydWUsIGRlZmF1bHQ6ICgpID0+IHNycygzMikudG9Mb3dlckNhc2UoKSB9LFxuICB2YWxpZFVSTHM6IHsgdHlwZTogVHlwZXMuVGV4dEFycmF5IH0sXG59KTtcblxuQXBwLnJlbGF0aW9uc2hpcCh7IHBhdGg6ICd2b3RlcycsIHJlZjogJ1ZvdGUnLCByZWZQYXRoOiAnYXBwJyB9KTtcbkFwcC5yZWxhdGlvbnNoaXAoeyBwYXRoOiAnYWNjZXNzVG9rZW5zJywgcmVmOiAnQWNjZXNzVG9rZW4nLCByZWZQYXRoOiAnY2xpZW50JyB9KTtcblxuQXBwLnNjaGVtYS5tZXRob2RzLmlzVmFsaWRVUkwgPSBmdW5jdGlvbih1cmwpIHtcbiAgZm9yICh2YXIgdmFsaWRVUkwgb2YgdGhpcy52YWxpZFVSTHMpIHtcbiAgICBpZiAodXJsLmluZGV4T2YodmFsaWRVUkwpID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG50cmFuc2Zvcm0udG9KU09OKEFwcCk7XG5cbkFwcC5kZWZhdWx0Q29sdW1ucyA9ICd0aXRsZSwga2V5LCBzZWNyZXQnO1xuQXBwLnJlZ2lzdGVyKCk7XG4iXX0=