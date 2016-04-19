#! /usr/bin/env node

console.log('exporting.')

var fs = require('fs')
var path = require('path')
var fse = require('fs.extra')
var zip = require('node-zip')
var util = require('./util')
var os = require('os');

var args = process.argv.slice(2)

var machine = args[0]
if (!machine) {
    console.log('machine-export <machine-name>')
    process.exit(1)
}

var dm = new util.dm(machine);
console.dir(dm);

fse.rmrfSync(dm.tmpDir)

util.copyDir(dm.configDir, dm.tmpDir)

console.log('Copied data to: ' + dm.tmpDir);

fs.mkdirSync( dm.tmpCerts )

processConfig()
createZip()

function processConfig() {
    var home = os.homedir();
    var configFile = fs.readFileSync(dm.configFile);
    var config = JSON.parse(configFile.toString())

    util.recurseJson(config, function (parent, key, value) {
        if (typeof value === 'string') {
            
            console.log('Json value: ' + value);

            if ( util.startsWith(value, dm.certsDir + path.sep ) ) {

                var name = value.substring(value.lastIndexOf(path.sep) + 1);
    
                console.log('Cert name: ' + name);

                if(name.length > 0) {
                    util.copy(value, path.join(dm.tmpCerts, name))
                    value = path.join(dm.certsDir, name)
                }
            }
            value = value.replace(home, '{{HOME}}')
            parent[key] = value
        }
    })

    fs.writeFileSync(dm.tmpConfigFile, JSON.stringify(config))
}

function createZip() {
    var zip = new require('node-zip')()
    var walker = fse.walk(dm.tmpDir)

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
        fs.writeFileSync(machine + '.zip', data, 'binary')
        fse.rmrfSync(dm.tmpDir)
    })
}
