'use strict';

require('gracelog').config({ color: true, level: '>= info' });
var logger = require('gracelog').create('test');
var cluster = require('../');

cluster.start({
	max: 6,
	sync: false,
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

		var list = ['HERO','VILLAIN'];
		var index = 0;
		setInterval(function () {
			cluster.sendToRole(list[index], 'Hello ' + list[index] + ' from master:' + Date.now());
			index += 1;
			if (index ===  list.length) {
				index = 0;
			}
		}, 10);
	}

	if (!cluster.isMaster()) {
		cluster.registerRole(['HERO', 'VILLAIN'], function (error, roleName) {
			if (error) {
				console.error('Error: failed to be a HERO OR VILLAIN', cluster.id());
				return;
			}
			console.log('I am a ' + roleName, cluster.id());
		});
		cluster.on('message', function (msg) {
			console.log('worker', cluster.id(), 'received message:', msg);
		});
		cluster.sendCommand('test', 'test request', function (error, res) {
			console.log('response for test:', error, res);
		});
		cluster.sendCommand('error', 'error request', function (error, res) {
			console.log('response for error:', error, res);
		});

		var list = ['HERO','VILLAIN'];
		var index = 1;
		setInterval(function () {
			cluster.sendToRole(list[index], 'Hello ' + list[index] + ' from worker(' + cluster.id() + '):' + Date.now());
			index += 1;
			if (index ===  list.length) {
				index = 0;
			}
		}, 7);
	}

});
