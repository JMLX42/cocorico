var keystone = require('keystone');
var redis = require('redis');
var bcrypt = require('bcrypt');

var	Ballot = keystone.list('Ballot');

exports.getByVoteIdAndVoter = function(voteId, voter, callback)
{
	Ballot.model.find({vote: voteId})
		.exec(function(err, ballots)
		{
			if (err)
				return callback(err, null);

			var found = false;
			if (ballots && ballots.length != 0)
				for (var ballot of ballots)
					if (bcrypt.compareSync(voter, ballot.voter))
						return callback(null, ballot);

			if (!found)
				callback(null, null);
		});
}
