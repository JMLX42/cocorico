var MetaInspector = require('node-metainspector');

exports.fetchURLMeta = function(url, callback)
{
    var client = new MetaInspector(url, { timeout: 5000 });

    client.on("fetch", () => {
        callback(
            null,
            {
                title: client.ogTitle ? client.ogTitle : client.title,
                url: url,
                description: client.ogDescription ? client.ogDescription : client.description,
                image: client.image,
                type: client.ogType,
                latitude: client.ogLatitude,
                longitude: client.ogLongitude
            }
        );
    });

    client.on("error", (err) => {
        callback(err, null);
    });

    client.fetch();
};
