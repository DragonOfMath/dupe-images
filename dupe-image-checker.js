const Jimp      = require('jimp');
const readAll   = require('./utils/read-all');
const hex       = require('./utils/hex');
const Array     = require('./utils/Array');
const Format    = require('./utils/formatting');
const File      = require('./utils/File');
const FileCache = require('./utils/FileCache');
const Logger    = require('./utils/Logger');

var logger = new Logger('Dupe Checker');

// hamming distance function (stolen from pHash)
function distance(h1, h2) {
	var sum = 0;
	for (var i = 0; i < h1.length; i++) {
		if (h1[i] != h2[i]) {
			sum++;
		}
	}
	return sum / h1.length;
}
function flcmp(f1, f2) {
	return Math.abs(f1 - f2) < 0.0001;
}

module.exports = function findDuplicates(directory, options = {}) {
	options.threshold = options.threshold === undefined ? 0.1  : options.threshold;
	options.tolerance = options.tolerance === undefined ? 0.01 : options.tolerance;
	options.filter    = /([^\/]+)\.(jpe?g|png|bmp)$/i;
	options.dirname   = directory;
	
	// the keys are the filenames and the values are the filepaths
	logger.log('Reading images from',directory);
	var filesObj = readAll(options);
	var images = Object.keys(filesObj).map(name => new File(filesObj[name]));
	var length = images.length;
	var duplicates = [];
	var startTime = Date.now();
	
	logger.log(`Caching data for ${length} images...`);
	var imgHashCache = new FileCache(directory, 'imgcache');
	
	logger.indent();
	
	/* Step 1. Cache all the image widths x heights, sizes, and perceptual hashes.
	   Note: Jimp takes a while to load images... */
	return images.forEachAsync((file, i) => {
		logger.log(`[${i+1}/${length}]`, file.name);
		logger.indent();
		if (imgHashCache.has(file.name)) {
			try {
				// use the cached data to skip loading the image
				Object.assign(file, imgHashCache.get(file.name));
				
				// decompress the hash
				var hash16 = file._hash;
				file._hash = hex.hex2bin(file._hash);
				
				logger.cyan('Size: ', file.width, 'x', file.height);
				logger.cyan('Bytes:', Format.bytes(file._size));
				logger.cyan('Hash: ', hash16);
			} catch (e) {
				logger.error(e);
			} finally {
				logger.unindent();
				return;
			}
		} else {
			return Jimp.read(file.path).then(image => {
				var size   = file.size();
				var hash2  = image.hash(2);
				var hash16 = hex.bin2hex(hash2);
				
				file.width  = image.bitmap.width;
				file.height = image.bitmap.height;
				file._size  = size;
				file._hash  = hash2;
				
				// no longer need this
				delete image;
				
				logger.cyan('Size: ', file.width, 'x', file.height);
				logger.cyan('Bytes:', Format.bytes(file._size));
				logger.cyan('Hash: ', hash16);
				
				// cache the file metadata, but with the hash compressed
				return imgHashCache.set(file.name, {
					width:  file.width,
					height: file.height,
					_size:  size,
					_hash:  hash16
				});
			})
			.catch(e => logger.error(e))
			.then(() => logger.unindent())
		}
	})
	/* Step 2. Sort images. This is completely useless to do. */
	.then(() => {
		logger.unindent();
		logger.ln();
		logger.log(`Sorting ${length} images by size...`);
		
		images = images.sort((f1, f2) => ((f1._size > f2._size) ? 1 : (f1._size < f2._size) ? -1 : 0));
		
		logger.log('Finished sorting.');
	})
	/* Step 3. Compare pairs of images by ratio and hash, then perform pixel matching if they're alike.
	   If the pixel match returns a small value, it means the images are identical (or near-identical). */
	.then(() => {
		logger.ln();
		logger.log(`Dupe-checking ${length} images...`);
		logger.indent();
		
		return images.forEachAsync((file1, i) => {
			if (isDuplicate(file1)) return;
			
			logger.log(`[${i+1}/${length}]`, file1.name, `(${Format.bytes(file1._size)})`);
			logger.indent();
			logger.cyan('Size:', file1.width, 'x', file1.height);
			
			var image1 = null;
			return images.forEachAsync((file2, j) => {
				if (isDuplicate(file2)) return;
				if (!sameRatio(file1, file2)) return;
				
				var dist = distance(file1._hash, file2._hash);
				if (dist > 2/64) return;
				
				logger.log(`[${j+1}/${length}]`, file2.name, `(${Format.bytes(file2._size)})`);
				logger.indent();
				
				if (dist == 0) {
					//logger.green('Instant Match');
					//logger.unindent();
					//markAsDuplicates(file1,file2);
					//return;
				}
				
				// read the first image once
				return Promise.resolve(image1 || Jimp.read(file1.path).then(i => image1 = i))
				.then(() => {
					return Jimp.read(file2.path).then(image2 => {
						// https://github.com/oliver-moran/jimp#comparing-images
						var difference = Jimp.diff(image1, image2, options.threshold).percent;
						
						if (difference == 0) {
							logger.green('Match:', Format.percent(1-difference));
							markAsDuplicates(file1, file2);
						} else if (difference < options.tolerance) {
							logger.yellow('Match:', Format.percent(1-difference));
							markAsDuplicates(file1, file2);
						} else {
							logger.red('Match:', Format.percent(1-difference));
						}
					})
				})
				.catch(e => logger.error(e))
				.then(() => logger.unindent())
			}, i + 1, length)
			.catch(e => logger.error(e))
			.then(() => logger.unindent())
		}, 0, length - 1)
	})
	.then(() => {
		var endTime = Date.now();
		var timeElapsed = endTime - startTime;
		
		delete imgHashCache;
		
		logger.unindent();
		logger.ln();
		logger.log(`Finished in ${Format.time(timeElapsed)}.`);
		logger.log(`${duplicates.length} duplicate groups found containing ${duplicates.reduce((a,x) => a.concat(x),[]).length} images.`);
		
		// a jagged array of File objects
		return duplicates;
	})
	.catch(e => logger.error(e));
	
	/* // Old method, not reliable
	return images.mapAsync((file,idx) => {
		return fileHash(file)
		.then(hash => {
			console.log(`[${idx+1}/${images.length} | ${~~(10000*idx/images.length)/100}%] ${file} -> ${hash}`);
			return hash;
		});
	});
	.then(hashes => {
		for (var i = 0, j; i < hashes.length - 1; ++i) {
			for (j = i + 1; j < hashes.length; ++j) {
				if (hashes[i] == hashes[j]) {
					markAsDuplicates(images[i],images[j]);
				}
			}
		}
		return duplicates;
	});
	*/
	
	function markAsDuplicates(...files) {
		for (var dupes of duplicates) {
			for (var file of files) {
				if (dupes.includes(file)) {
					for (var newFile of files.diff(dupes)) {
						dupes.push(newFile);
					}
					return;
				}
			}
		}
		duplicates.push(files);
	}
	function isDuplicate(file) {
		for (var dupes of duplicates) {
			if (dupes.includes(file)) {
				return true;
			}
		}
		return false;
	}
	function sameRatio(i1, i2) {
		return flcmp(i1.width/i2.width, i1.height/i2.height);
	}
};
