'use strict';
var cluster = require('cluster');
var logger = require('../lib/logger');

exports.createMsgData = function (cmd, workerId, msgData) {
	return {
		command: cmd,
		targetWorkerId: workerId,
		msg: msgData,
		from: null,
		pid: process.pid
	};
};

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

exports.relay = function (cmd, data, worker) {
	// pass the message to the target worker
	var targetWorker = cluster.workers[data.targetWorkerId];

	if (!targetWorker) {
		logger.error(
			'Message target worker [ID: ' + data.targetWorkerId +
			'] no longer exists'
		);
		return;
	}

	if (targetWorker.id === worker.id) {
		// ignore message to itself
		return;
	}

	logger.verbose(
		'Relay message to worker [' + targetWorker.id + ']' +
		' from worker [' + data.from + '] via master:',
		data.msg
	);

	var relayedData = {
		command: cmd,
		from: data.from,
		pid: data.pid,
		msg: data.msg
	};
	exports.send(relayedData, cluster.workers[data.targetWorkerId]);
};
