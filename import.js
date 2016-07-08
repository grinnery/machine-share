#! /usr/bin/env node

var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var tgz = require('tar.gz');
var util = require('./util');

var args = process.argv.slice(2);

var zipfile = args[0];

if (!zipfile) {
    console.log('machine-import <machine.tar.gz>');
    process.exit(1);
}

var machine = path.basename(zipfile, '.tar.gz');

var dm = new util.dm(machine);

try {
    fs.statSync(dm.configDir);
    console.log(`Machine "${machine}" already exists`);
    process.exit(2);
} catch (e) {
    //ok
}

fse.removeSync(dm.tmpDir);

tgz().extract(zipfile, dm.temp)
.then( function() {
    processConfig(dm.tmpConfigFile);
    fse.copySync(dm.tmpDir, dm.configDir);
    fse.removeSync(dm.tmpDir);
    console.log('Done');
    process.exit(0);
})
.catch(function(err) {
    console.log('Error ', err.stack);
    process.exit(3);
});


function fromPortableConfig(key, value) {
    if (typeof value === 'string' && value.includes('{{HOME}}')) {
        value = value.replace('{{HOME}}', dm.home);
        if( path.sep == '\\') {
            value = value.replace(/\//g, path.sep);
        }
    }
    return value;
}


function processConfig(configFile) {
    var config = fse.readJsonSync(configFile);
    fs.writeFileSync(configFile, JSON.stringify(config, fromPortableConfig, 4));
}
