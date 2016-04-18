'use strict';

var logger = require('gracelog').create('test');
var cluster = require('../');

cluster.start({
	max: 6,
	autoSpawn: true,
	logger: logger
}, function () {

	console.log('ready!!!!!!!!', (cluster.isMaster() ? 'master' : 'worker'), cluster.id());

	if (cluster.isMaster()) {
		cluster.registerCommand('test', function (data, cb) {
			console.log('command test exected:', data);
			cb(null, { message: 'Hello' });
		});
		cluster.registerCommand('error', function (data, cb) {
			console.log('command error exected:', data);
			cb(new Error('error'));
		});

		setInterval(function () {
			cluster.sendToRole('HERO', 'Hello from master:' + Date.now());
		}, 10000);
	}

	if (!cluster.isMaster()) {
		cluster.registerRole('HERO', function (error) {
			if (error) {
				console.error('Error: failed to be a HERO', cluster.id());
				return;
			}
			console.log('I am a HERO', cluster.id());
		});
		cluster.sendCommand('test', 'test request', function (error, res) {
			console.log('response for test:', error, res);
		});
		cluster.sendCommand('error', 'error request', function (error, res) {
			console.log('response for error:', error, res);
		});

		setInterval(function () {
			cluster.sendToRole('HERO', 'Hello from worker(' + cluster.id() + '):' + Date.now());
		}, 7000);
	}

});
