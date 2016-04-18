#!/usr/bin/env headstone
var config = require('../config.json');

var async = require('async');
var keystone = require('keystone');
var stringify = require('json-stable-stringify');
var fs = require('fs');
var beautify_html = require('js-beautify').html;

var Page = keystone.list('Page'),
    Media = keystone.list('Media');

function savePage(page, next)
{
    var output = './pages/' + page.slug + '.js';// getOutputFilename(page.slug);

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

            process.stdout.write('writing page \'' + page.slug + '\'... ');

            var filename = page.contentType == 'HTML'
                ? page.slug + '.html'
                : page.slug + '.md'
            fs.writeFileSync("./pages/" + filename, content, 'utf8');

            page = JSON.parse(stringify(page));
            delete page.markdown;
            delete page.html;

            fs.writeFileSync(
                "./pages/" + page.slug + '.json',
                stringify(
                    { page: page },
                    {space : '\t'}
                ),
                'utf8'
            );

            process.stdout.write('done\n');

            next();
        });
}

function savePages(pages, done)
{
    var ops = [];
    for (var page of pages)
    {
        (function(page)
        {
            ops.push(function(next)
            {
                savePage(page, next);
            });
        })(page);
    }

    ops.push(function(next) {
        done();
    });

    async.waterfall(ops);
}

module.exports = function(slugs, done)
{
    if (!fs.existsSync('./pages'))
        fs.mkdirSync('./pages');

    if (slugs)
    {
        Page.model.find().where({slug : {$in : slugs.split(',')} }).select('-_id').exec((err, pages) => {
            savePages(pages, done);
        });
    }
    else
    {
        Page.model.find().select('-_id').exec((err, pages) => {
            savePages(pages, done);
        });
    }
}
