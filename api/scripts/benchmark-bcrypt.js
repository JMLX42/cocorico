#!/usr/bin/env headstone

var bcrypt = require('bcrypt');
var config = require('../config.json');
var keystone = require('keystone');
var range = require("range");
var util = require('util');
var srs = require('secure-random-string');

module.exports = function(done)
{
    var magnitude = 5;
    var count = Math.pow(10, magnitude);

    console.log(util.format('Bcrypt benchmark with 10^%s 32-bytes random strings', magnitude));

    console.time('time');
    var encryptedStrings = range.range(count).map((i) => {
        process.stdout.write('.');
        return bcrypt.hashSync(srs(32), 10);
    });
    process.stdout.write(' ');
    console.timeEnd('time');

    done();

};
