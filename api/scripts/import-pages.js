#!/usr/bin/env headstone
var config = require('../config.json');

var async = require('async');
var keystone = require('keystone');
var stringify = require('json-stable-stringify');
var fs = require('fs');
var path = require('path');

var Page = keystone.list('Page'),
    Media = keystone.list('Media');

function find(startPath,filter)
{
    var res = [];
    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (filename.indexOf(filter)>=0) {
            res.push(filename);
        };
    };

    return res;
}

module.exports = function(done)
{
    var pageFiles = find('./pages', '.json');

    async.waterfall(
        pageFiles.map((pageFile) => (callback) => {
            var pageData = JSON.parse(fs.readFileSync(pageFile));
            var page = pageData.page;

            if (page.contentType == 'HTML')
                page.html = fs.readFileSync('./pages/' + page.slug + '.html', 'utf8');
            else
                page.markdown = { md : fs.readFileSync('./pages/' + page.slug + '.md', 'utf8')};

            // console.log(page);

            Page.model.update(
                {slug: page.slug},
                page,
                {upsert: true},
                (err) => callback(err)
            );
        }),
        done
    );
}
