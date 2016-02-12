#!/usr/bin/env headstone
var config = require('../config.json');

var async = require('async');
var keystone = require('keystone');
var stringify = require('json-stable-stringify');
var fs = require('fs');
var beautify_html = require('js-beautify').html;

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

            var uriRegex = new RegExp("\/" + config.uploadDir + "\/([^\.]*)\.");
            var imgRegEx = page.contentType == 'HTML'
                ? new RegExp(/<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g)
                : new RegExp(/(!\[.*?\]\()(.+?)(\))/g);
            var content = page.contentType == 'HTML'
                ? beautify_html(page.html, {indent:4})
                : page.markdown.md;
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
                    for (var media of medias)
                    {
                        mediaMigration += "\t\tfunction(callback) {\n"
                            + "\t\t\tMedia.model.update(\n"
                            + "\t\t\t\t{slug: '" + media.slug + "'},";

                        stringify(media, {space : '\t'}).split('\n').map(function(v, i, t)
                        {
                            mediaMigration += "\n\t\t\t\t" + v;
                        });

                        mediaMigration += ",\n"
                            + "\t\t\t\t{upsert: true},\n"
                            + "\t\t\t\tfunction(err) { callback(err); }\n"
                            + "\t\t\t);\n"
                            + "\t\t},\n";
                    }

                    process.stdout.write('writing page \'' + slug + '\'... ');
                    var migrationScript = "var keystone = require('keystone');\n"
                        + "var async = require('async');\n\n"
                        + "var fs = require('fs');\n\n"
                        + "var Page = keystone.list('Page');\n"
                        + "var Media = keystone.list('Media');\n\n"
                        + "module.exports = function(done) {\n"
                        + "\tasync.waterfall([\n"
                        + mediaMigration
                        + "\t\tfunction(callback) {\n"
                        + "\t\t\tPage.model.update(\n"
                        + "\t\t\t\t{slug: '" + slug + "'},";

                    var filename = page.contentType == 'HTML'
                        ? page.slug + '.html'
                        : page.slug + '.md'
                    fs.writeFileSync("./updates/pages/" + filename, content, 'utf8');

                    if (page.contentType == 'HTML')
                        page.html = 'fs.readFileSync(\'./updates/pages/' + filename + '\', \'utf8\')'
                    else
                    {
                        page.markdown = { 'md' : 'fs.readFileSync(\'./updates/pages/' + filename + '\', \'utf8\')' };
                        page.markdown.html = undefined;
                    }

                    stringify(page, {space : '\t'})
                        .replace(/"(fs.readFileSync\(.*\))"/, "$1")
                        .split('\n').map(function(v, i, t)
                        {
                            migrationScript += "\n\t\t\t\t" + v;
                        });

                    migrationScript += ",\n"
                        + "\t\t\t\t{upsert: true},\n"
                        + "\t\t\t\tfunction(err) { callback(err); }\n"
                        + "\t\t\t);\n"
                        + "\t\t},\n"
                        + "\t\tfunction(error, result) { done(); }\n"
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
    if (!fs.existsSync('./updates'))
        fs.mkdirSync('./updates');
    if (!fs.existsSync('./updates/pages'))
        fs.mkdirSync('./updates/pages');

    if (slugs)
        slugs = slugs.split(',');
    else
        slugs = config.savedPages;

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
