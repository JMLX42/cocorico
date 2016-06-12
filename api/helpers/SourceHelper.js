var MetaInspector = require('node-metainspector');
var AllHtmlEntities = require('html-entities').AllHtmlEntities;

exports.fetchURLMeta = function(url, callback)
{
    var client = new MetaInspector(
        url,
        {
            timeout: 5000,
            headers: {
                'User-Agent': 'request'
            }
        }
    );

    client.on("fetch", () => {
        var description = client.ogDescription
            ? client.ogDescription
            : client.description;

        if (description)
            description = AllHtmlEntities.decode(description);

        callback(
            null,
            {
                title: client.ogTitle ? client.ogTitle : client.title,
                url: url,
                description: description,
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
