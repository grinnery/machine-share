#! /usr/bin/env node

var fs = require('fs');
var path = require('path');
var fse = require('fs.extra');  //TODO: replace with fs-extra
var zip = require('node-zip');
var util = require('./util');
var os = require('os');

var args = process.argv.slice(2);

var machine = args[0];
if (!machine) {
    console.log('machine-export <machine-name>');
    process.exit(1);
}

var dm = new util.dm(machine);
console.dir(dm);

fse.rmrfSync(dm.tmpDir);

util.copyDir(dm.configDir, dm.tmpDir);
console.log('Copied data to: ' + dm.tmpDir);

fs.mkdirSync( dm.tmpCerts );
fs.mkdirSync( dm.tmpExt );

processConfig();

createZip();


function toPortableConfig(key, value) {

    if (typeof value === 'string' && value.length > 0) {

        var orig_value = value;
        console.log(`Json: "${key}": "${value}"`);

        if ( util.startsWith(value, dm.certsDir + path.sep ) ) {
            var name = path.basename(value);
            console.log('Cert name: ' + name);

            if(name.length > 0) {
                util.copy(value, dm.tmpCerts);
                // the copy of global certs from source machine, stored in a sub-folder on the target
                value = path.join(dm.configDir, dm.certsName, name);
            }
        } else if(util.startsWith(value, dm.configDir + path.sep )) {
            // normal file inside the machine config dir

        } else if( util.isfile(value) ) {
            console.log(`External file reference "${value}"`);
            util.copy(value, dm.tmpExt);
            value = path.join(dm.configDir, dm.extName, path.basename(value));
        }
        value = value.replace(dm.home, '{{HOME}}');

        if( path.sep == '\\') {
            value = value.replace(/\\/g, '/');
        }

        if(value != orig_value) {
            console.log(`"${orig_value}" -> "${value}"`);
        }
    }

    return value;
}

function processConfig() {
    var configFile = fs.readFileSync(dm.configFile);
    var config = JSON.parse(configFile.toString());

    var drv = config['DriverName'];
    if( drv ) {
        console.log(`Machine driver: ${drv}`);
    }

    fs.writeFileSync(dm.tmpConfigFile, JSON.stringify(config, toPortableConfig, 4));
}

function createZip() {
    var zip = new require('node-zip')();
    var walker = fse.walk(dm.tmpDir);

    walker.on('file', function (root, stat, next) {
        var dir = path.resolve(root, stat.name);
        var folder = root.substring(dm.tmpDir.length + 1);
        var file = stat.name;
        console.log('Zipping: ' + folder + ' : ' + file);
        zip.folder( folder ).file(file, fs.readFileSync(dir).toString());
        next();
    });
    walker.on('end', function () {
        var data = zip.generate({base64: false, compression: 'DEFLATE'});
        fs.writeFileSync(machine + '.zip', data, 'binary');
        fse.rmrfSync(dm.tmpDir);
        console.log(`Config saved to "${machine}.zip"`);
    })
}
