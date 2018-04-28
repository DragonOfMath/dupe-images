Array.prototype.forEachAsync = function (callback, start = 0, end = this.length) {
	var iterable = this;
	function _next(i) {
		return Promise.resolve(callback(iterable[i], i))
		.then(() => {
			if (i+1 < end) {
				return _next(i+1);
			}
		});
	}
	return _next(start);
};
Array.prototype.mapAsync = function (callback, start = 0, end = this.length) {
	var iterable = this;
	var mapped = [];
	function _next(i) {
		return Promise.resolve(callback(iterable[i], i))
		.then(value => {
			if (typeof(value) !== 'undefined') mapped.push(value);
			if (i+1 < end) {
				return _next(i+1);
			} else {
				return mapped;
			}
		});
	}
	return _next(start);
};
Array.prototype.diff = function (arr) {
	return this.filter(e => !arr.includes(e));
};

module.exports = Array;
