#! /usr/bin/env node

var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var zip = require('node-zip');
var util = require('./util');
var os = require('os');

var args = process.argv.slice(2);

var zipfile = args[0];

if (!zipfile) {
    console.log('machine-import <machine.zip>');
    process.exit(1);
}

var machine = path.basename(zipfile, '.zip');

var dm = new util.dm(machine);

try {
    fs.statSync(dm.configDir);
    console.log('that machine already exists');
    process.exit(1);
} catch (e) {
    //ok
}

fse.emptyDirSync(dm.tmpDir);

unzip();
processConfig();

fse.copySync(dm.tmpDir, dm.configDir);

fse.removeSync(dm.tmpDir);

function unzip() {
    var zip = new require('node-zip')();
    zip.load(fs.readFileSync(zipfile));
    for (var f in zip.files) {
        var file = zip.files[f];
        if (!file.dir) {
            var outPath = path.join(dm.tmpDir, file.name);
            util.mkdir(path.dirname(outPath));
            fs.writeFileSync(outPath, file.asNodeBuffer());
        }
    }
}

function fromPortableConfig(key, value) {
    if (typeof value === 'string' && value.includes('{{HOME}}')) {
        value = value.replace('{{HOME}}', dm.home);
        if( path.sep == '\\') {
            value = value.replace(/\//g, path.sep);
        }
    }
    return value;
}

function processConfig() {
    var home = os.homedir();

    var configFile = fs.readFileSync(dm.tmpConfigFile);
    var config = JSON.parse(configFile.toString());

/* grin: Not entirely sure why it's there - there is no counterpart in export

    var raw = config.RawDriver;
    if (raw) {
        var decoded = new Buffer(raw, 'base64').toString();
        var driver = JSON.parse(decoded);

        // update store path
        driver.StorePath = dm.dock;

        var updatedBlob = new Buffer(JSON.stringify(driver)).toString('base64');

        // update old config
        config.RawDriver = updatedBlob;
    }
*/
    fs.writeFileSync(dm.tmpConfigFile, JSON.stringify(config, fromPortableConfig, 4));
}
