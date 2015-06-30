'use strict';

var logger;
var name;

exports.set = function (loggerIn) {
	logger = loggerIn;
};

exports.setName = function (nameIn) {
	name = nameIn;
};

exports.verbose = function () {
	if (!logger) {
		return console.log.apply(console, defaultLog('verbose', arguments));
	}
	log('verbose', customLog(arguments));
};

exports.debug = function () {
	if (!logger) {
		return console.log.apply(console, defaultLog('debug', arguments));
	}
	log('debug', customLog(arguments));
};

exports.info = function () {
	if (!logger) {
		return console.log.apply(console, defaultLog('info', arguments));
	}
	log('info', customLog(arguments));
};

exports.error = function () {
	if (!logger) {
		return console.error.apply(console, defaultLog('error', arguments));
	}
	log('error', customLog(arguments));
};

exports.fatal = function () {
	if (!logger) {
		return console.error.apply(console, defaultLog('fatal', arguments));
	}
	log('fatal', customLog(arguments));
};

function log(type, args) {

	if (typeof logger[type] !== 'function') {
		return;		
	}

	logger[type].apply(logger, args);
}

function customLog(args) {
	var list = [
		'[' + name + ']'
	];
	for (var i in args) {
		list.push(args[i]);
	}
	return list;
}

function defaultLog(type, args) {
	var list = [
		name ? '[' + name + ']' : '',
		'<' + type + '>'
	];
	for (var i in args) {
		list.push(args[i]);
	}
	return list;
}
