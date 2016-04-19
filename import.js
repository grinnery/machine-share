#! /usr/bin/env node

console.log('importing.')

var fs = require('fs')
var path = require('path')
var fse = require('fs.extra')
var zip = require('node-zip')
var util = require('./util')
var os = require('os');

var args = process.argv.slice(2)

var machine = args[0]
if (!machine) {
    console.log('machine-import <config-zip>')
    process.exit(1)
}

var machine = machine.substring(0, machine.length - 4)

var dm = new util.dm(machine);

console.dir(dm);

try {
    fs.statSync(dm.configDir)
    console.log('that machine already exists')
    process.exit(1)
} catch (e) {
    //ok
}

fse.rmrfSync(dm.tmpDir)

unzip()

processConfig()

util.copyDir(dm.tmpDir, dm.configDir)
// certs are extracted to a machine-specific location
util.copyDir( dm.tmpCerts, path.join(dm.certDir, machine) )
fse.rmrfSync(tmp)

function unzip() {
    var zip = new require('node-zip')()
    zip.load(fs.readFileSync(machine + '.zip'))
    for (var f in zip.files) {
        var file = zip.files[f]
        if (!file.dir) {
            var outPath = path.join(dm.tmpDir, file.name);
            util.mkdir(path.dirname(outPath));
            fs.writeFileSync(outPath, file.asNodeBuffer());
        }
    }
}

function processConfig() {
    var home = os.homedir();

    var configFile = fs.readFileSync(dm.tmpConfigFile);
    var config = JSON.parse(configFile.toString());

    util.recurseJson(config, function (parent, key, value) {
        if (typeof value === 'string') {
            parent[key] = value.replace('{{HOME}}', home)
        }
    })

    var raw = config.RawDriver
    if (raw) {
        var decoded = new Buffer(raw, 'base64').toString()
        var driver = JSON.parse(decoded)

        // update store path
        driver.StorePath = dm.dock;

        var updatedBlob = new Buffer(JSON.stringify(driver)).toString('base64')

        // update old config
        config.RawDriver = updatedBlob
    }

    fs.writeFileSync(dm.configFile, JSON.stringify(config))
}
