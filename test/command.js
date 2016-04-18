'use strict';

var logger = require('gracelog').create('test');
var cluster = require('../');

cluster.start({
	max: 2,
	logger: logger
});

if (cluster.isMaster()) {
	cluster.registerCommand('test', function (data, cb) {
		console.log('command test exected:', data);
		cb(null, { message: 'Hello' });
	});
	cluster.registerCommand('error', function (data, cb) {
		console.log('command error exected:', data);
		cb(new Error('error'));
	});
}

if (!cluster.isMaster()) {
	cluster.sendCommand('test', 'test request', function (error, res) {
		console.log('response for test:', error, res);
	});
	cluster.sendCommand('error', 'error request', function (error, res) {
		console.log('response for error:', error, res);
	});
}
