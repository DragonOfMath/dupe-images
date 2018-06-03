const child_process  = require('child_process');
const path = require('path');

const APP_DIR = path.dirname(require.main.filename);

class FileExplorer {
	static goto(directory = './') {
		directory = path.resolve(APP_DIR, directory);
		child_process.exec(`start "" "${directory}"`);
	}
}

module.exports = FileExplorer;
