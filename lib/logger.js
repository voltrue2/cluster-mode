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
		return console.log.apply(console, getArgs('verbose', arguments));
	}
	log('verbose', arguments);
};

exports.debug = function () {
	if (!logger) {
		return console.log.apply(console, getArgs('debug', arguments));
	}
	log('debug', arguments);
};

exports.info = function () {
	if (!logger) {
		return console.log.apply(console, getArgs('info', arguments));
	}
	log('info', arguments);
};

exports.error = function () {
	if (!logger) {
		return console.error.apply(console, getArgs('error', arguments));
	}
	log('error', arguments);
};

exports.fatal = function () {
	if (!logger) {
		return console.error.apply(console, getArgs('fatal', arguments));
	}
	log('fatal', arguments);
};

function log(type, args) {

	if (typeof logger[type] !== 'function') {
		return;		
	}

	for (var i in args) {
		logger[type](args[i]);
	}
}

function getArgs(type, args) {
	var list = [
		name ? '[' + name + ']' : '',
		'<' + type + '>'
	];
	for (var i in args) {
		list.push(args[i]);
	}
	return list;
}
