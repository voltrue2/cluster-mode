'use strict';

var cluster = require('../');
require('gracelog').config({ color: true, level: '>= debug' });
var logger = require('gracelog').create('test');
var cluster = require('../');

cluster.start({
	max: 6,
	sync: false,
	autoSpawn: true,
	logger: logger
}, function () {
	require('gracelog').setPrefix(cluster.isMaster ? 'MASTER' : 'WORKER');
	
	logger.debug('Start');

	if (cluster.isMaster()) {
		sendCommandToWorker();
	} else {
		registerCommandInWorker();
	}
});

function sendCommandToWorker() {
	var callback = function (error, res) {
		logger.debug('MASTER: Response received from worker', res.id, res.echo);
	};
	setTimeout(function () {
		var workers = cluster.workers();
		for (var id in workers) {
			var msg = 'Hello from worker ' + id;
			logger.debug('MASTER: sending command to worker:', id);
			cluster.sendCommandToWorker(workers[id], 'echo', msg, callback);
		}
	}, 1000);
}

function registerCommandInWorker() {
	logger.debug('WORKER: register command');
	cluster.registerCommand('echo', function (msg, cb) {
		logger.debug('WORKER: handling request @ worker', cluster.id());
		cb(null, { id: cluster.id(), echo: msg });
	});
}

