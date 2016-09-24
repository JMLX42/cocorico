#!/usr/bin/env headstone

var async = require('async');
var keystone = require('keystone');
var stringify = require('json-stable-stringify');
var fs = require('fs');
var beautify_html = require('js-beautify').html;

var Page = keystone.list('Page'),
  Media = keystone.list('Media');

function savePage(page, next) {
  var imgRegEx = new RegExp(/\/upload\/(.*)\.(jpg|png)/g);
  var content = page.contentType === 'HTML'
    ? beautify_html(page.html, {indent:4})
    : page.markdown.md;
  var imgs = [];

  while (match = imgRegEx.exec(content)) {
    if (match)
      imgs.push(match[1]);
  }

  if (imgs.length !== 0)
    console.log('found medias:', imgs);

  Media.model.find({ 'slug': { '$in': imgs} })
  .select('-_id')
  .exec((err, medias) => {
    for (var media of medias) {
      fs.writeFileSync(
        './db/media/' + media.slug + '.json',
        stringify(media, { space : '\t' }),
        'utf8'
      );
    }

    process.stdout.write('writing page \'' + page.slug + '\'... ');

    var filename = page.contentType === 'HTML'
      ? page.slug + '.html'
      : page.slug + '.md'
    fs.writeFileSync('./db/pages/' + filename, content, 'utf8');

    page = JSON.parse(stringify(page));
    delete page.markdown;
    delete page.html;

    fs.writeFileSync(
          './db/pages/' + page.slug + '.json',
          stringify(page, { space : '\t' }),
          'utf8'
      );

    process.stdout.write('done\n');

    next();
  });
}

function savePages(pages, done) {
  var ops = [];
  for (var page of pages) {
    (function(page) {
      ops.push(function(next) {
        savePage(page, next);
      });
    })(page);
  }

  ops.push(function(next) {
    done();
  });

  async.waterfall(ops);
}

module.exports = function(slugs, done) {
  if (!fs.existsSync('./db/pages'))
    fs.mkdirSync('./db/pages');
  if (!fs.existsSync('./db/media'))
    fs.mkdirSync('./db/media');

  if (slugs) {
    Page.model.find().where({slug : {$in : slugs.split(',')} }).select('-_id').exec((err, pages) => {
      savePages(pages, done);
    });
  } else {
    Page.model.find().select('-_id').exec((err, pages) => {
      savePages(pages, done);
    });
  }
}
