var fs = require('fs')
var os = require('os');
var path = require('path');


module.exports.copy = function (from, to_folder) {
    var name = path.basename(from);
    var dest = path.join(to_folder, name);

    var file = fs.readFileSync(from);
    fs.writeFileSync(dest, file);

    console.log(`Copied ${from} to ${dest}`);
};

module.exports.isfile = function (path) {
    var stat;
    try {
        stat = fs.statSync(path)
    } catch (e) {
        return false;
    }
    return stat.isFile();
};


module.exports.startsWith = function (s, prefix) {
    return s.substring(0, prefix.length) === prefix;
};


// common paths
// var dm = new util.dm(machine_name);
// 
module.exports.dm = function(_name) {

    var tmpdir = '' + os.tmpdir();
    if( tmpdir.length <= 1) {
        throw new Error('bad tmp dir: ' + tmpdir);
    }

    var nname = path.normalize(_name);
    if( nname.length < 1 
//        || nname.match(/\W/) != null 
      ) {
        throw new Error( 'bad machine name "' + _name + '"');
    }
    
    this._name = nname;

    this.temp = '' + os.tmpdir();
    this.home = os.homedir();
    this.dock = path.join( this.home, '.docker', 'machine');
    this.machines = path.join( this.dock, 'machines');

    this.certsName = 'certs';
    this.certsDir = path.join( this.dock, this.certsName);
    this.configDir = path.join( this.machines, this._name);
    this.configFile = path.join( this.configDir, 'config.json');
    this.tmpDir = path.join( tmpdir, this._name);
    this.tmpConfigFile = path.join( this.tmpDir, 'config.json');
    this.tmpCerts = path.join( this.tmpDir, this.certsName);
    this.extName = 'ext';
    this.tmpExt = path.join( this.tmpDir, this.extName);

};
