var keystone = require('keystone');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var Types = keystone.Field.Types;

var Vote = new keystone.List('Vote', {
	defaultSort: '-time'
});

Vote.add({
	value: { type: String, default: true, required: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	voter: { type: String, required: true, initial: true },
	poll: { type: Types.Relationship, ref: 'Poll', required: true, initial: true }
});

Vote.getByPollIdAndVoter = function(pollId, voter, callback)
{
	Vote.model.find()
		.where('poll', pollId)
		.exec(function(err, votes)
		{
			if (err)
				return callback(err, null);

			if (votes && votes.length != 0)
				for (var vote of votes)
					if (bcrypt.compareSync(voter, vote.voter))
						return callback(null, vote);

			return callback(null, null);
		});
}

transform.toJSON(Vote);

Vote.defaultColumns = 'voter, value, time';
Vote.register();
