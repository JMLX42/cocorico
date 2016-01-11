var keystone = require('keystone');
var transform = require('model-transform');
var bcrypt = require('bcrypt');
var redis = require('redis');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
	defaultSort: '-time',
	nodelete: true,
	nocreate: true
});

Ballot.add({
	value: { type: String, default: true, required: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	voter: { type: String, required: true, initial: true },
	text: { type: Types.Relationship, ref: 'Text', required: true, initial: true },
	voterAge: { type: Types.Number, required: true, initial: true },
	voterGender: { type: Types.Select, options: ['male', 'female'], initial: true },
});

Ballot.getByTextIdAndVoter = function(textId, voter, callback)
{
	var client = redis.createClient();
	var key = 'ballot/' + textId + '/' + voter;

	client.on('connect', function()
	{
		client.get(key, function(err, reply)
		{
			if (!err && reply)
				return callback(null, JSON.parse(reply));

			Ballot.model.find()
				.where('text', textId)
				.exec(function(err, ballots)
				{
					if (err)
						return callback(err, null);

					var found = false;
					if (ballots && ballots.length != 0)
						for (var ballot of ballots)
							if (bcrypt.compareSync(voter, ballot.voter))
							{
								client.set(key, JSON.stringify(ballot.toJSON()), function(err, reply)
								{
									callback(err, err ? null : ballot);
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

transform.toJSON(Ballot);

Ballot.defaultColumns = 'voter, value, time';
Ballot.register();
