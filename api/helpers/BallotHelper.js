var keystone = require('keystone');
var redis = require('redis');
var bcrypt = require('bcrypt');

var	Ballot = keystone.list('Ballot');

exports.getByTextIdAndVoter = function(textId, voter, callback)
{
	// var client = redis.createClient();
	var key = 'ballot/' + textId + '/' + voter;

	// client.on('connect', function()
	// {
	// 	client.get(key, function(err, reply)
	// 	{
	// 		if (!err && reply)
	// 			return callback(null, JSON.parse(reply));

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
								// client.set(key, JSON.stringify(ballot.toJSON()), function(err, reply)
								// {
									callback(err, err ? null : ballot);
								// });
								found = true;
								break;
							}

					if (!found)
						callback(null, null);
				});
		// });

	// });

}
