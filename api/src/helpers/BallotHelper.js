var keystone = require('keystone');
var bcrypt = require('bcrypt');

var	Ballot = keystone.list('Ballot');

exports.getByVoteIdAndVoter = function(voteId, voter, callback) {
  Ballot.model.find({vote: voteId})
    .exec((err, ballots) => {
      if (err)
        return callback(err, null);

      if (ballots && ballots.length !== 0)
        for (var ballot of ballots)
          if (bcrypt.compareSync(voter, ballot.voter))
            return callback(null, ballot);

      return callback(null, null);
    });
}
