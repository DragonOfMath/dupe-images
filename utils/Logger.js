const PIPE = '|';
const CODE = {
	Info: 'info',
	Warn: 'warn',
	Error: 'error'
};
const FONT = {
	Reset:      "\x1b[0m",
	Bright:     "\x1b[1m",
	Dim:        "\x1b[2m",
	Underscore: "\x1b[4m",
	Blink:      "\x1b[5m",
	Reverse:    "\x1b[7m",
	Hidden:     "\x1b[8m"
};
const FOREGROUND = {
	Black:   "\x1b[30m",
	Red:     "\x1b[31m",
	Green:   "\x1b[32m",
	Yellow:  "\x1b[33m",
	Blue:    "\x1b[34m",
	Magenta: "\x1b[35m",
	Cyan:    "\x1b[36m",
	White:   "\x1b[37m"
};
const BACKGROUND = {
	Black:    "\x1b[40m",
	Red:      "\x1b[41m",
	Green:    "\x1b[42m",
	Yellow:   "\x1b[43m",
	Blue:     "\x1b[44m",
	Magenta:  "\x1b[45m",
	Cyan:     "\x1b[46m",
	White:    "\x1b[47m"
};

class Logger {
	constructor(name) {
		this.name = name;
		Object.defineProperty(this, '_indent', {
			value: '',
			writable: true,
			enumerable: false
		});
	}
	indent() {
		this._indent += '  ';
	}
	unindent() {
		this._indent = this._indent.substring(0, this._indent.length - 2);
	}
	ln() {
		console.log('');
	}
	log(...x) {
		console.log(FOREGROUND.White + this.name, PIPE + this._indent, ...x);
		return x[0];
	}
	info(...x) {
		console.log(FOREGROUND.Green + this.name, PIPE, CODE.Info, PIPE + this._indent, ...x, FONT.Reset);
		return x[0];
	}
	warn(...x) {
		console.warn(FOREGROUND.Yellow + this.name, PIPE, CODE.Warn, PIPE + this._indent, ...x, FONT.Reset);
		return x[0];
	}
	error(...x) {
		console.error(FOREGROUND.Red + this.name, PIPE, CODE.Error, PIPE + this._indent, ...x, FONT.Reset);
		return x[0];
	}
	red(...x) {
		console.log(FOREGROUND.Red + this.name, PIPE + this._indent, ...x, FONT.Reset);
	}
	green(...x) {
		console.log(FOREGROUND.Green + this.name, PIPE + this._indent, ...x, FONT.Reset)
	}
	yellow(...x) {
		console.log(FOREGROUND.Yellow + this.name, PIPE + this._indent, ...x, FONT.Reset)
	}
	blue(...x) {
		console.log(FOREGROUND.Blue + this.name, PIPE + this._indent, ...x, FONT.Reset)
	}
	magenta(...x) {
		console.log(FOREGROUND.Magenta + this.name, PIPE + this._indent, ...x, FONT.Reset)
	}
	cyan(...x) {
		console.log(FOREGROUND.Cyan + this.name, PIPE + this._indent, ...x, FONT.Reset)
	}
}

module.exports = Logger;
