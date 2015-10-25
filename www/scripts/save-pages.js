#!/usr/bin/env headstone

require('dotenv').load();

var async = require('async');
var keystone = require('keystone');
var fs = require('fs');

var Page = keystone.list('Page'),
    Media = keystone.list('Media');

function getOutputFilename(slug)
{
    var output = null;
    for (var file of fs.readdirSync('./updates'))
        if (file.match(new RegExp("page-" + slug)))
            output = file;

    var version = [0, 0, 0];
    if (!output)
    {
        for (var file of fs.readdirSync('./updates'))
        {
            var match = file.match(new RegExp(
                "([0-9]+)\.([0-9]+)\.([0-9]+)-page-"
            ));
            if (match)
            {
                var major = parseInt(match[1]);
                var minor = parseInt(match[2]);
                var build = parseInt(match[3]);

                version = [
                    Math.max(version[0], major),
                    Math.max(version[1], minor),
                    Math.max(version[2], build)
                ];
            }
        }

        version[2]++;
        output = version.join('.') + '-page-' + slug + '.js';
    }

    output = './updates/' + output;

    return output;
}

function savePage(slug, next)
{
    var output = getOutputFilename(slug);

    console.log('output file:', output);

    process.stdout.write('loading page \'' + slug + '\'... ');

    Page.model.findOne()
        .select('-_id')
        .where('slug', slug)
        .exec(function(err, page)
        {
            if (err)
            {
                console.log('database error', err);
                return next();
            }
            if (!page)
            {
                console.log('page does not exist');
                return next();
            }

            process.stdout.write('done\n');

            var uriRegex = new RegExp("\/" + process.env.UPLOAD_DIR + "\/(.*)\.");
            var imgRegEx = page.contentType == 'HTML'
                ? new RegExp(/<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g)
                : new RegExp(/(!\[.*?\]\()(.+?)(\))/g);
            var content = page.contentType == 'HTML'
                ? page.html
                : page.markdown;
            var imgs = [];

            while (match = imgRegEx.exec(content))
            {
                match = match[1].match(uriRegex)[1];

                if (match)
                    imgs.push(match);
            }

            if (imgs.length != 0)
                console.log('found medias:', imgs);

            var mediaMigration = "";
            Media.model.find({ 'slug': { '$in': imgs} })
                .select('-_id')
                .exec(function(err, medias)
                {
                    var first = true;
                    for (var media of medias)
                    {
                        mediaMigration += "\t\tfunction(next) {\n"
                            + "\t\t\tnew Media.model(" + JSON.stringify(media) + ").save(next);\n"
                            + "\t\t},\n";
                        first = false;
                    }

                    process.stdout.write('writing page \'' + slug + '\'... ');
                    var migrationScript = "var keystone = require('keystone');\n"
                        + "var async = require('async');\n\n"
                        + "var Page = keystone.list('Page');\n"
                        + "var Media = keystone.list('Media');\n\n"
                        + "module.exports = function(done) {\n"
                        + "\tasync.series([\n"
                        + mediaMigration
                        + "\t\tfunction(next) {\n"
                        + "\t\t\tnew Page.model(" + JSON.stringify(page) + ").save(next);\n"
                        + "\t\t},\n"
                        + "\t\tfunction(next) { done(); }\n"
                        + "\t]);\n"
                        + "};";
                    fs.writeFileSync(output, migrationScript, 'utf8');
                    process.stdout.write('done\n');

                    next();
                });
        });
}

module.exports = function(slugs, done)
{
    if (!slugs)
        slugs = process.env.SAVED_PAGES;
    slugs = slugs.split(',');

    var ops = [];
    for (var slug of slugs)
    {
        (function(slug)
        {
            ops.push(function(next)
            {
                savePage(slug, next);
            });
        })(slug);
    }

    ops.push(function(next) {
        done();
    });

    async.waterfall(ops);
}
