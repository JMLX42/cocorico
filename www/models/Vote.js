var keystone = require('keystone');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var redis = require('redis');

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

Vote.schema.post('remove', function(next)
{
	var client = redis.createClient();
	var key = 'vote/' + this.poll + '/' + this.voter;

	client.on('connect', function()
	{
		client.del(key, function(err, reply)
		{
			next();
		});
	});
});

Vote.getByPollIdAndVoter = function(pollId, voter, callback)
{
	var client = redis.createClient();
	var key = 'vote/' + pollId + '/' + voter;

	client.on('connect', function()
	{
		client.get(key, function(err, reply)
		{
			if (!err && reply)
				return callback(null, JSON.parse(reply));

			Vote.model.find()
				.where('poll', pollId)
				.exec(function(err, votes)
				{
					if (err)
						return callback(err, null);

					var found = false;
					if (votes && votes.length != 0)
						for (var vote of votes)
							if (bcrypt.compareSync(voter, vote.voter))
							{
								client.set(key, JSON.stringify(vote.toJSON()), function(err, reply)
								{
									callback(err, err ? null : vote);
								});
								found = true;
								break;
							}

					if (!found)
						callback(null, null);
				});
		});

	});

}

transform.toJSON(Vote);

Vote.defaultColumns = 'voter, value, time';
Vote.register();
