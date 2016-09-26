var config = require('/opt/cocorico/api-web/config.json');

var keystone = require('keystone');
var transform = require('model-transform');

var Types = keystone.Field.Types;

var Ballot = new keystone.List('Ballot', {
  defaultSort: '-updatedAt',
  track: { createdAt: true, updatedAt: true },
  nodelete: config.env !== 'development',
  nocreate: true,
});

Ballot.add({
  status: {
    type: Types.Select,
    options: ['signing', 'queued', 'pending', 'initialized', 'registered', 'complete', 'error'],
    required: true,
    initial: true,
    noedit: true,
  },
  voter: { type: String, required: true, initial: true, noedit: true },
  vote: { type: Types.Relationship, ref: 'Vote', required: true, initial: true, noedit: true },
  error: { type: String, noedit: true },
});

Ballot.getByVoteIdAndUser = function(voteId, voter, callback) {
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

transform.toJSON(Ballot);

Ballot.defaultColumns = 'time, status, vote, createdAt, updatedAt';
Ballot.register();
