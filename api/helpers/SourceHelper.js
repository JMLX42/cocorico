var MetaInspector = require('node-metainspector');

exports.fetchPageTitle = function(url, callback)
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
