// requireAll by Felix Geisendörfer (c) 2012 under MIT License
// modified for reading arbitrary files and returning only filenames

var fs = require('fs');

var DEFAULT_EXCLUDE_DIR = /^\./;
var DEFAULT_FILTER = /^([^\.].*)\..+$/;
var DEFAULT_RECURSIVE = true;

module.exports = function readAll(options) {
  var dirname = typeof options === 'string' ? options : options.dirname;
  var excludeDirs = options.excludeDirs === undefined ? DEFAULT_EXCLUDE_DIR : options.excludeDirs;
  var filter = options.filter === undefined ? DEFAULT_FILTER : options.filter;
  var modules = {};
  var recursive = options.recursive === undefined ? DEFAULT_RECURSIVE : options.recursive;
  var resolve = options.resolve || identity;
  var map = options.map || identity;

  function excludeDirectory(dirname) {
    return !recursive ||
      (excludeDirs && dirname.match(excludeDirs));
  }

  function filterFile(filename) {
    if (typeof filter === 'function') {
      return filter(filename);
    }

    var match = filename.match(filter);
    if (!match) return;

    return match[1] || match[0];
  }

  var files = fs.readdirSync(dirname);

  files.forEach(function (file) {
    var filepath = dirname + '/' + file;
    if (fs.statSync(filepath).isDirectory()) {

      if (excludeDirectory(file)) return;

      modules[map(file, filepath)] = readAll({
        dirname: filepath,
        filter: filter,
        excludeDirs: excludeDirs,
        map: map,
        resolve: resolve
      });

    } else {
      var name = filterFile(file);
      if (!name) return;

      modules[map(name, filepath)] = resolve(filepath);
    }
  });

  return modules;
};

function identity(val) {
  return val;
}
