var fs = require('fs')

var os = require('os');
var path = require('path');

exports.copy = function (from, to) {
    var file = fs.readFileSync(from)
    fs.writeFileSync(to, file)
    console.log('Copied ' + from + ' to ' + to);
}

exports.copyDir = function (from, to) {
    exports.mkdir(to)
    var files = fs.readdirSync(from)
    for (var i = 0; i < files.length; i++) {
        var file = from + '/' + files[i]
        if (fs.statSync(file).isFile()) {
            exports.copy(file, to + '/' + files[i])
        }
    }
    console.log('Copied dir ' + from + ' to ' + to);
}

exports.mkdir = function (dir) {
    try {
        fs.mkdirSync(dir)
    } catch (e) {
        console.log(e.message)
    }
}

exports.startsWith = function (s, prefix) {
    return s.substring(0, prefix.length) === prefix
}

exports.recurseJson = function (obj, func) {
    for (var key in obj) {
        var val = obj[key]
        func(obj, key, val)
        if (val !== null && typeof val === 'object') {
            exports.recurseJson(val, func)
        }
    }
}

// common paths
// var dm = new util.dm(machine_name);
// 
module.exports.dm = function(_name) {

    var tmpdir = '' + os.tmpdir();
    if( tmpdir.length <= 1) {
        throw new Error('bad tmp dir: ' + tmpdir);
    }

    var nname = path.normalize(_name);
    if( nname.length < 1 || nname.match(/\W/) != null ) {
        throw new Error( 'bad machine name "' + _name + '"');
    }
    
    this._name = nname;

    this.dock = path.join(os.homedir(), '.docker', 'machine');
    this.machines = path.join( this.dock, 'machines');

    this.certsDir = path.join( this.dock, 'certs');
    this.configDir = path.join( this.machines, this._name);
    this.configFile = path.join( this.configDir, 'config.json');
    this.tmpDir = path.join( tmpdir, this._name);
    this.tmpConfigFile = path.join( this.tmpDir, 'config.json');
    this.tmpCerts = path.join( this.tmpDir, 'certs');

}
