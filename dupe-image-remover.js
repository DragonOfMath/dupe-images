const Array          = require('./utils/Array');
const Format         = require('./utils/formatting');
const File           = require('./utils/File');
const FileCache      = require('./utils/FileCache');
const FileExplorer   = require('./utils/FileExplorer');
const Logger         = require('./utils/Logger');
const findDuplicates = require('./dupe-image-checker');

var logger = new Logger('Dupe Remover');

function longestName(n1, n2) {
	return (n1.length > n2.length) ? n1 : n2;
}

module.exports = function removeDuplicates(directory, options = {}) {
	options.namePreference = options.namePreference !== undefined ? options.namePreference : longestName;
	options.typePreference = options.typePreference !== undefined ? options.typePreference : '.png';
	
	var retained = [];
	var removed  = [];
	var renamed  = 0;
	
	return findDuplicates(directory, options)
	.then(duplicates => {
		if (duplicates.length == 0) {
			logger.ln();
			logger.red('No duplicates to remove.');
			return;
		}
		
		var startTime = Date.now();
		var imgHashCache = new FileCache(directory, 'imgcache');
		
		logger.ln();
		logger.log('Determining duplicates to remove...');
		logger.indent();
		
		return duplicates.forEachAsync((group,idx) => {
			logger.log(`Group ${idx+1} (${group.length} images)`);
			logger.indent();
			
			var bestSizeFile = group[0];
			var bestName = bestSizeFile.name;
			
			logger.log('Starting As:', bestName, Format.bytes(bestSizeFile._size));
			return group.slice(1).forEachAsync(file => {
				logger.log('Comparing:  ', file.name, Format.bytes(file._size));
				
				bestName = options.namePreference(file.name, bestName);
				
				// use the highest resolution
				if (bestSizeFile.width > file.width && bestSizeFile.height > file.height) {
					// no change
				} else if (file.width > bestSizeFile.width && file.height > bestSizeFile.height) {
					[bestSizeFile,file] = [file,bestSizeFile];
					
				// same image size, use the smaller file size
				} else if (bestSizeFile._size < file._size) {
					// no change
				} else if (file._size < bestSizeFile._size) {
					[bestSizeFile,file] = [file,bestSizeFile];
					
				// same image size and file size, so choose the preferred type
				} else if (bestSizeFile.ext == options.typePreference) {
					// no change
				} else if (file.ext == options.typePreference) {
					[bestSizeFile,file] = [file,bestSizeFile];
					
				// same image size, file size, and type. probably best to do nothing about it.
				} else {
					// no change
				}
				
				logger.cyan('Best Size:  ', bestSizeFile.name, Format.bytes(bestSizeFile._size));
				logger.cyan('Best Name:  ', bestName);
				
				// remove the inferior file
				logger.green('Removed:    ', file.name);
				removed.push(file);
				file.delete();
				return imgHashCache.delete(file.name);
			})
			.then(() => {
				logger.green('Retained:   ', bestSizeFile.name);
				retained.push(bestSizeFile);
				if (bestSizeFile.name != bestName && options.rename) {
					logger.yellow('Renamed As: ', bestName);
					renamed++;
					var prevName = bestSizeFile.name;
					bestName = bestSizeFile.rename(bestName);
					return imgHashCache.replace(prevName, bestSizeFile.name);
				}
			})
			.then(() => {
				logger.unindent();
			});
		})
		.then(() => {
			var endTime = Date.now();
			var timeElapsed = endTime - startTime;
			var totalBytes = removed.reduce((a,f) => a += f._size, 0);
			
			logger.unindent();
			logger.ln();
			logger.log(`Finished in ${Format.time(timeElapsed)}.`);
			logger.log(`${removed.length} files removed, ${renamed} files renamed.`);
			logger.log(`${Format.bytes(totalBytes)} of disk space freed.`);
			
			FileExplorer.goto(directory);
		});
	})
	.then(() => {
		return {retained, removed};
	})
	.catch(e => logger.error(e));
};
