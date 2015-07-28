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

module.exports.CODES = {
	EXPECTED: 0,
	UNCAUGHT_EXCEPTION: 1,
	PARSER_ERROR: 3,
	EVAL_ERROR: 4,
	FATAL_ERROR: 5,
	INTERNAL_EXPECTION: 6,
	RUNTIME_EXCEPTION_ERROR: 7,
	INVALID_ARG: 9,
	RUNTIME_ERROR: 10,
	INVALID_DEBUG_ARG: 12
};

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
