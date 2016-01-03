var keystone = require('keystone');
var async = require('async');
var transform = require('model-transform');
var bcrypt = require('bcrypt');

var Source = keystone.list('Source');

var Types = keystone.Field.Types;

var Text = new keystone.List('Text', {
    autokey: { path: 'slug', from: 'title', unique: true },
    map: { name: 'title' },
    defaultSort: '-createdAt'
});

Text.add({
	title: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
    publishedAt: Date,
	content: { type: Types.Markdown, wysiwyg: true, height: 400 },
    author: { type: String, required: true, initial: true },
    status: { type: Types.Select, options: ['draft', 'review', 'debate', 'published'], default: 'draft' },
    likes: { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true, noedit: true },
    score: { type: Types.Number, required: true, default: 0, format: false }
});

Text.schema.pre('save', function(next)
{
    var self = this;
    var mdLinkRegex = new RegExp(/\[([^\[]+)\]\(([^\)]+)\)/g);
    var ops = [function(callback) { callback(null, []); }];

    while (match = mdLinkRegex.exec(this.content.md))
    {
        (function(url) {
            ops.push(function(result, callback)
            {
                // FIXME: do not fetch pages that are already listed in the text sources
                Source.fetchPageTitle(url, function(err, title)
                {
                    if (err)
                        result.push({url: url, title: ''});
                    else
                        result.push({url: url, title: title});

                    callback(null, result);
                });
            });
        })(match[2]);
    }

    async.waterfall(ops, function(error, result)
    {
        var saveOps = [function(callback)
        {
            Source.model.find({text: self, author: ''}).remove(function(err)
            {
                callback(err);
            });
        }];

        if (error)
        {
            console.log(error);
            next(error); // FIXME: retry later
        }
        else
        {
            saveOps = saveOps.concat(result.map(function(source)
            {
                return function(callback)
                {
                    Source.model({
                        title: source.title,
                        url: source.url,
                        // auto: true,
                        // author: bcrypt.hashSync(req.user.sub, 10),
                        text: self
                    }).save(function(err)
                    {
                        callback(err);
                    });
                };
            }));

            async.waterfall(saveOps, function(error)
            {
                next();
            });
        }
    });
});

Text.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'text' });
Text.relationship({ path: 'sources', ref: 'Source', refPath: 'text' });

transform.toJSON(Text);

Text.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Text.register();
