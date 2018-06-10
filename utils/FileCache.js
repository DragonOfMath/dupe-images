const FilePromise = require('./FilePromise');

class Cache {
	constructor(directory, name) {
		this.path = FilePromise.join(directory, name + '.json');
		this.data = {};
		if (FilePromise.existsSync(this.path)) {
			this.load();
		}
	}
	load() {
		this.data = FilePromise.readSync(this.path);
	}
	save() {
		return FilePromise.create(this.path, this.data);
	}
	has(filename) {
		return filename in this.data;
	}
	set(filename, data) {
		this.data[filename] = data;
		return this.save();
	}
	get(filename) {
		return this.data[filename];
	}
	delete(filename) {
		delete this.data[filename];
		return this.save();
	}
	replace(oldFilename, newFilename) {
		this.data[newFilename] = this.data[oldFilename];
		delete this.data[oldFilename];
		return this.save();
	}
}

module.exports = Cache;
