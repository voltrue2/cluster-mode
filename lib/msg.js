'use strict';
var cluster = require('cluster');
var logger = require('../lib/logger');

exports.send = function (msg, worker) {
	try {
		msg = JSON.stringify(msg);
	} catch (e) {
		logger.error('Invalid message data:', e);
	}
	if (worker) {
		// send message to specified worker only
		logger.verbose('Sending message to worker: ID - ' + worker.id, msg);
		worker.send(msg);
		return;
	}
	if (cluster.isMaster) {
		// send message to all workers
		for (var id in cluster.workers) {
			logger.verbose('Sending message to worker: ID - ' + id, msg);
			cluster.workers[id].send(msg);
		}
		return;
	}
	// send message to master
	logger.verbose('Sending message to master', msg);
	process.send(msg);
};
