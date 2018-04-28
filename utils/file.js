const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

function replaceExtension(name, extension) {
	if (path.extname(name) != extension) {
		name = name.match(/([^\\\/]+)\.[\w\d]+$/)[1];
		// in case the new name had a dangling extension
		if (path.extname(name) != extension) name += extension;
	}
	return name;
}

module.exports = class File {
	constructor(filepath) {
		this.path = path.resolve(path.dirname(require.main.filename), filepath);
	}
	get path() {
		return path.join(this.dir, this.name);
	}
	set path(x) {
		this.dir  = path.dirname(x);
		this.name = path.basename(x);
		this.ext  = path.extname(x);
	}
	delete() {
		return fs.unlinkSync(this.path);
	}
	rename(newName) {
		newName = replaceExtension(newName, this.ext);
		this.prevPath = this.path;
		this.prevName = this.name;
		this.name = newName;
		fs.renameSync(this.prevPath, this.path);
		return newName;
	}
	// https://gist.github.com/GuillermoPena/9233069
	hash(algorithm = 'md5') {
		return new Promise((resolve, reject) => {
			var hash = crypto.createHash(algorithm);
			try {
				var file = fs.ReadStream(this.path);
				file.on('data', data => {hash.update(data)});
				file.on('end', () => resolve(hash.digest('hex')));
			} catch (error) {
				return reject(error);
			}
		});
	}
	size() {
		return fs.statSync(this.path).size;
	}
};
