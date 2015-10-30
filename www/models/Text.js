var keystone = require('keystone');
var async = require('async');
var transform = require('model-transform');
var MetaInspector = require('node-metainspector');

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
    additionalData: { type: String, hidden: true }
});

function fetchPageTitle(url, callback)
{
    var client = new MetaInspector(url, { timeout: 5000 });

    client.on("fetch", function()
    {
        callback(null, client.title);
    });

    client.on("error", function(err)
    {
        callback(error, null);
    });

    client.fetch();
}

Text.schema.pre('save', function(next)
{
    var self = this;
    var mdLinkRegex = new RegExp(/\[([^\[]+)\]\(([^\)]+)\)/g);
    var ops = [function(callback) { callback(null, ""); }];

    while (match = mdLinkRegex.exec(this.content.md))
    {
        (function(url) {
            ops.push(function(result, callback)
            {
                fetchPageTitle(url, function(err, title)
                {
                    result += (result ? '\n' : '') + '* [' + title + '](' + url + ')';

                    callback(null, result);
                });
            });
        })(match[2]);
    }

    async.waterfall(ops, function(error, result)
    {
        self.additionalData = result;

        next();
    });
});

Text.relationship({ path: 'ballots', ref: 'Ballot', refPath: 'text' });

transform.toJSON(Text);

Text.defaultColumns = 'title, state|20%, author, publishedAt|15%';
Text.register();
