var keystone = require('keystone');
var transform = require('model-transform');
var MetaInspector = require('node-metainspector');

var Types = keystone.Field.Types;

var Source = new keystone.List('Source', {
	defaultSort: '-time'
});

Source.add({
    title: { type: String, default: '', required: false, initial: true },
	url: { type: String, default: '', required: true, initial: true },
	time: { type: Types.Datetime, default: Date.now },
	author: { type: String, required: false, default: '', initial: true },
	text: { type: Types.Relationship, ref: 'Text', required: true, initial: true },
	likes: { type: Types.Relationship, ref: 'Like', required: true, initial: true, many: true }
});

Source.fetchPageTitle = function(url, callback)
{
    var client = new MetaInspector(url, { timeout: 5000 });

    client.on("fetch", function()
    {
        callback(null, client.title);
    });

    client.on("error", function(err)
    {
        callback(err, null);
    });

    client.fetch();
};

transform.toJSON(Source);

Source.defaultColumns = 'author, value, time';
Source.register();
