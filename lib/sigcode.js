'use strict';

// exit codes
var CODES = {
	'0': 'Expected Exit',
	'1': 'Uncaught Fatal Exception',
	'3': 'Internal Javascript Parse Error',
	'4': 'Internal Javascript Evaluation Failure',
	'5': 'Fatal Error',
	'6': 'Non-function Internal Exception Handler',
	'7': 'Internal Exception Handler Run-Time Failure',
	'9': 'Invalid Argument',
	'10': 'Internal Javascript Run-Time Failure',
	'12': 'Invalid Debug Argument'
};
// signal exit code > 128
var SIG_CODE = 128;

module.exports.getNameByExitCode = function (code) {

	if (code === null) {
		return 'Unknown';
	}

	var name = CODES[code.toString()] || 'Unknown';

	if (code > SIG_CODE) {
		name = 'Signal Exit';
	}

	return name;
};
