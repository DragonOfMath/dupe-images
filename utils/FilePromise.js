const fs   = require('fs');
const path = require('path');

const TEXT_TYPES = ['.txt','.json','.js','.log','.bat'];
const WRITE = 'w';
const WRITE_APPEND = 'wx';
const READ = 'r';

function splitLines(content) {
	return content.split(/\r?\n/).filter(String);
}
function cb(resolve, reject, error, response) {
	if (error) return reject(error);
	else return resolve(response);
}
function promisify(f, ...args) {
	return new Promise((resolve, reject) => {
		f(...args, cb.bind(this, resolve, reject));
	});
}

class FilePromise {
	static resolve(filename) {
		if (path.isAbsolute(filename)) {
			return filename;
		} else {
			return path.resolve(this.APP_DIR, filename);
		}
	}
	static join(...paths) {
		return path.join(...paths);
	}
	static getDir(filepath) {
		return path.dirname(filepath);
	}
	static getName(filepath) {
		return path.basename(filepath);
	}
	static getExtension(filepath) {
		return path.extname(filepath);
	}
	/**
		Read and return a file's metadata
		@arg {String} filename - location of the file
		@return a Promise that resolves to the file stats Object
	*/
	static getStats(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.stats, filename);
	}
	/**
		Read and return a file's metadata synchronously
		@return the file stats Object
	*/
	static getStatsSync(filename) {
		filename = this.resolve(filename);
		return fs.statsSync(filename);
	}
	/**
		Reads a file's contents and returns the data in a Promise
		@arg {String} filename - location of the file
		@return a Promise that resolves to the contents of the file, cast to an appropriate type
	*/
	static read(filename) {
		filename = this.resolve(filename);
		var type = this.getExtension(filename);
		var encoding = TEXT_TYPES.includes(type) ? 'utf8' : undefined;
		return promisify.call(this, fs.readFile, filename, encoding)
		.then(data => {
			if (type === '.json') {
				data = JSON.parse(data);
			}
			return data;
		});
	}
	/**
		Reads a file's contents synchronously, returns the data
		@arg {String} filename - location of the file
	*/
	static readSync(filename) {
		filename = this.resolve(filename);
		var type = this.getExtension(filename);
		var encoding = TEXT_TYPES.includes(type) ? 'utf8' : undefined;
		var data = fs.readFileSync(filename, encoding);
		if (type === '.json') {
			data = JSON.parse(data);
		}
		return data;
	}
	/**
		Reads a file's contents and returns the data as an array of its lines in a Promise
		@arg {String} filename - location of the file
	*/
	static readLines(filename) {
		filename = this.resolve(filename);
		return this.read(filename).then(splitLines);
	}
	/**
		Reads a file's contents synchronously, and returns the data as an array of its lines
		@arg {String} filename - location of the file
	*/
	static readLinesSync(filename) {
		filename = this.resolve(filename);
		var data = this.readSync(filename);
		return (data && splitLines(data)) || [];
	}
	/**
		Reads multiple files and returns key/value pairs of their filenames/data
		@arg {Array<String>} filenames - location of the files
	*/
	static readAll(filenames) {
		filenames = filenames.map(f => this.resolve(f));
		return Promise.all(filenames.map(this.read))
		.then(results => {
			var o = {};
			for (var f = 0; f < filenames.length; f++) {
				o[filenames[f]] = results[f];
			}
			return o;
		});
	}
	/**
		Reads multiple files synchronously
		@arg {Array<String>} filenames - location of the files
	*/
	static readAllSync(filenames) {
		return filenames.map(this.readSync);
	}
	/**
		Creates an empty file, or replaces an existing one
		@arg {String} filename - location of the file
	*/
	static createEmpty(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.open, filename, WRITE);
	}
	/**
		Creates an empty file synchronously, or replaces an existing one
		@arg {String} filename - location of the file
	*/
	static createEmptySync(filename) {
		filename = this.resolve(filename);
		return fs.openSync(filename, WRITE);
	}
	/**
		Creates or overwrites an existing file with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static create(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return promisify.call(this, fs.writeFile, filename, contents);
	}
	/**
		Creates or overwrites an existing file synchronously with the given contents
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static createSync(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'File cannot be made with empty contents.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return fs.writeFileSync(filename, contents);
	}
	/**
		Creates or appends to an existing file
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static append(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'Cannot append empty contents to file.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return promisify.call(this, fs.appendFile, filename, contents);
	}
	/**
		Appends contents to a file synchronously
		@arg {String} filename - location of the file
		@arg {Any} contents - contents of the file
	*/
	static appendSync(filename, contents) {
		filename = this.resolve(filename);
		if (!contents) {
			throw 'Cannot append empty contents to file.';
		}
		if (typeof(contents) === 'object') {
			contents = JSON.stringify(contents);
		}
		return fs.appendFileSync(filename, contents);
	}
	/**
		Deletes a file
		@arg {String} filename - location of the file
	*/
	static delete(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.unlink, filename);
	}
	/**
		Deletes a file synchronously
		@arg {String} filename - location of the file
	*/
	static deleteSync(filename) {
		filename = this.resolve(filename);
		return fs.unlinkSync(filename);
	}
	/**
		Renames a file
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
	*/
	static rename(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return promisify.call(this, fs.rename, filename, newfilename);
	}
	/**
		Renames a file synchronously
		@arg {String} filename - location of the file
		@arg {String} newfilename - new file location
	*/
	static renameSync(filename, newfilename) {
		filename = this.resolve(filename);
		newfilename = this.resolve(newfilename);
		return fs.renameSync(filename, newfilename);
	}
	/**
		Checks that a file exists
		@arg {String} filename - location of the file
	*/
	static exists(filename) {
		filename = this.resolve(filename);
		return promisify.call(this, fs.exists, filename);
	}
	/**
		Checks that a file exists synchronously
		@arg {String} filename - location of the file
	*/
	static existsSync(filename) {
		filename = this.resolve(filename);
		return fs.existsSync(filename);
	}
	/**
		Make the directory at the given path
		@arg {String} filepath
	*/
	static makeDir(filepath) {
		filepath = this.resolve(filepath);
		return promisify.call(this, fs.mkdir, filepath);
	}
	/**
		Make the directory synchronously
		@arg {String} filepath
	*/
	static makeDirSync(filepath) {
		filepath = this.resolve(filepath);
		return fs.mkdirSync(filepath);
	}
	/**
		Get a list of files in the given directory
		@arg {String} filepath
	*/
	static readDir(filepath) {
		filepath = this.resolve(filepath);
		return promisify.call(this, fs.readdir, filepath);
	}
	/**
		Get a list of files in the given directory synchronously
		@arg {String} filepath
	*/
	static readDirSync(filepath) {
		filepath = this.resolve(path);
		return fs.readdirSync(filepath);
	}
}

FilePromise.APP_DIR = path.dirname(require.main.filename);

module.exports = FilePromise;
