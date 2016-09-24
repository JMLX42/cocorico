'use strict';

var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Ballot = keystone.list('Ballot');

exports.getByVoteIdAndVoter = function (voteId, voter, callback) {
  Ballot.model.find({ vote: voteId }).exec(function (err, ballots) {
    if (err) return callback(err, null);

    if (ballots && ballots.length !== 0) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = ballots[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var ballot = _step.value;

          if (bcrypt.compareSync(voter, ballot.voter)) return callback(null, ballot);
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
    }return callback(null, null);
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL0JhbGxvdEhlbHBlci5qcyJdLCJuYW1lcyI6WyJrZXlzdG9uZSIsInJlcXVpcmUiLCJiY3J5cHQiLCJCYWxsb3QiLCJsaXN0IiwiZXhwb3J0cyIsImdldEJ5Vm90ZUlkQW5kVm90ZXIiLCJ2b3RlSWQiLCJ2b3RlciIsImNhbGxiYWNrIiwibW9kZWwiLCJmaW5kIiwidm90ZSIsImV4ZWMiLCJlcnIiLCJiYWxsb3RzIiwibGVuZ3RoIiwiYmFsbG90IiwiY29tcGFyZVN5bmMiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsV0FBV0MsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFJQyxTQUFTRCxRQUFRLFFBQVIsQ0FBYjs7QUFFQSxJQUFJRSxTQUFTSCxTQUFTSSxJQUFULENBQWMsUUFBZCxDQUFiOztBQUVBQyxRQUFRQyxtQkFBUixHQUE4QixVQUFTQyxNQUFULEVBQWlCQyxLQUFqQixFQUF3QkMsUUFBeEIsRUFBa0M7QUFDOUROLFNBQU9PLEtBQVAsQ0FBYUMsSUFBYixDQUFrQixFQUFDQyxNQUFNTCxNQUFQLEVBQWxCLEVBQ0dNLElBREgsQ0FDUSxVQUFDQyxHQUFELEVBQU1DLE9BQU4sRUFBa0I7QUFDdEIsUUFBSUQsR0FBSixFQUNFLE9BQU9MLFNBQVNLLEdBQVQsRUFBYyxJQUFkLENBQVA7O0FBRUYsUUFBSUMsV0FBV0EsUUFBUUMsTUFBUixLQUFtQixDQUFsQztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNFLDZCQUFtQkQsT0FBbkI7QUFBQSxjQUFTRSxNQUFUOztBQUNFLGNBQUlmLE9BQU9nQixXQUFQLENBQW1CVixLQUFuQixFQUEwQlMsT0FBT1QsS0FBakMsQ0FBSixFQUNFLE9BQU9DLFNBQVMsSUFBVCxFQUFlUSxNQUFmLENBQVA7QUFGSjtBQURGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxLQUtBLE9BQU9SLFNBQVMsSUFBVCxFQUFlLElBQWYsQ0FBUDtBQUNELEdBWEg7QUFZRCxDQWJEIiwiZmlsZSI6IkJhbGxvdEhlbHBlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBrZXlzdG9uZSA9IHJlcXVpcmUoJ2tleXN0b25lJyk7XG52YXIgYmNyeXB0ID0gcmVxdWlyZSgnYmNyeXB0Jyk7XG5cbnZhclx0QmFsbG90ID0ga2V5c3RvbmUubGlzdCgnQmFsbG90Jyk7XG5cbmV4cG9ydHMuZ2V0QnlWb3RlSWRBbmRWb3RlciA9IGZ1bmN0aW9uKHZvdGVJZCwgdm90ZXIsIGNhbGxiYWNrKSB7XG4gIEJhbGxvdC5tb2RlbC5maW5kKHt2b3RlOiB2b3RlSWR9KVxuICAgIC5leGVjKChlcnIsIGJhbGxvdHMpID0+IHtcbiAgICAgIGlmIChlcnIpXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuXG4gICAgICBpZiAoYmFsbG90cyAmJsKgYmFsbG90cy5sZW5ndGggIT09IDApXG4gICAgICAgIGZvciAodmFyIGJhbGxvdCBvZiBiYWxsb3RzKVxuICAgICAgICAgIGlmIChiY3J5cHQuY29tcGFyZVN5bmModm90ZXIsIGJhbGxvdC52b3RlcikpXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgYmFsbG90KTtcblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIG51bGwpO1xuICAgIH0pO1xufVxuIl19