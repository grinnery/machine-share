#! /usr/bin/env node

var fs = require('fs');
var path = require('path');

var fse = require('fs-extra');
var tgz = require('tar.gz');

var util = require('./util');

var args = process.argv.slice(2);

var machine = args[0];
if (!machine) {
    console.log('machine-export <machine-name>');
    process.exit(1);
}

var dm = new util.dm(machine);

console.dir(dm);

fse.emptyDirSync(dm.tmpDir);
fse.mkdirsSync( dm.tmpCerts );
fse.mkdirsSync( dm.tmpExt );
fse.copySync(dm.configDir, dm.tmpDir);

processConfig(dm.tmpConfigFile);
createTgzFolder(dm.tmpDir, machine + '.tar.gz');

function toPortableConfig(key, value) {

    if (typeof value === 'string' && value.length > 0) {

        var orig_value = value;
//        console.log(`Json: "${key}": "${value}"`);

        if ( util.startsWith(value, dm.certsDir + path.sep ) ) {
            var name = path.basename(value);
//            console.log('Cert name: ' + name);

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
        if(value != orig_value) {
            if( path.sep == '\\') {
                // convert all paths to forward slash
                value = value.replace(/\\/g, '/');
            }
            // console.log(`"${orig_value}" -> "${value}"`);
        }
    }

    return value;
}


function processConfig(configPath) {
    var config = fse.readJsonSync(configPath);

    var drv = config['DriverName'];
    if( drv ) {
        // TODO: not much sense to export 'virtualbox' etc
        console.log(`Machine driver: "${drv}"`);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, toPortableConfig, 4));
}


function createTgzFolder(srcFolder, dstFile) {
    tgz().compress(srcFolder, dstFile)
    .then(function() {
        console.log(`Config saved to "${dstFile}"`);
        process.exit(0);
    })
    .catch(function(err) {
        console.log('Archive Error ', err.stack);
        process.exit(3);
    });

}
