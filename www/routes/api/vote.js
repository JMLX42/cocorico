var keystone = require('keystone');
var bcrypt = require('bcrypt');

var Text = keystone.list('Text'),
    Ballot = keystone.list('Ballot');

exports.result = function(req, res)
{
    var textId = req.params.textId;

    Text.model.findOne(textId)
        .exec(function(err, text)
        {
            if (err)
                return res.apiError('database error', err);

            if (!text)
                return res.status(404).send();

            Ballot.model.find({text : text})
                .exec(function(err, ballots)
                {
                    if (err)
                        return res.apiError('database error', err);

                    var result = {
                        yes : 0,
                        no : 0
                    };

                    for (var ballot of ballots)
                        result[ballot.value] += 1;

                    res.apiResponse({result : result});
                });
        });

}
