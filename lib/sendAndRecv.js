'use strict';

// master to worker request and response communication

var uuid = require('./uuid');
var msg = require('./msg');
var logger = require('./logger');

// used by master process only
var commandHandlers = {};

// used by worker process only
var callbackQueues = {};

// this is used by master process only
module.exports.registerCommand = function (cmd, handler) {
	commandHandlers[cmd] = handler;
};

// this is used by worker process only
//cmd: {string} command name 
module.exports.createReq = function (cmd, data) {
	return {
		cid: uuid.v4(),
		cmd: cmd,
		data: data
	};
};

// this is used by master process only
module.exports.createRes = function (cid, error, data) {

	if (error) {
		error = {
			message: error.message,
			code: error.code
		};
	}

	return {
		response: true,
		cid: cid,
		error: error,
		data: data
	};
};

// this is used by worker process only
module.exports.sendRequest = function (cmd, data, cb) {
	if (!cb) {
		throw new Error('MissingRequestCallback');
	}
	var cmdMsg = module.exports.createReq(cmd, data);
	callbackQueues[cmdMsg.cid] = cb;
	msg.send(cmdMsg);
};

// called from master only
module.exports.sendRequestToWorker = function (worker, cmd, data, cb) {
	if (!cb) {
		throw new Error('MissingRequestCallback');
	}
	var cmdMsg = module.exports.createReq(cmd, data);
	callbackQueues[cmdMsg.cid] = cb;
	msg.send(cmdMsg, worker);
};

// this is used by worker process only
// this function is called from src/process
module.exports.handleResponse = function (cmdMsg) {

	if (!cmdMsg.cid || !cmdMsg.response) {
		return;
	}

	var callback = callbackQueues[cmdMsg.cid];
	
	delete callbackQueues[cmdMsg.cid];

	if (!callback) {
		logger.error('Callback missing: cid ' + cmdMsg.cid);
		return;
	}

	if (cmdMsg.error) {
		var error = new Error(cmdMsg.error.message);
		error.code = cmdMsg.error.code || null;
	}
	callback(cmdMsg.error, cmdMsg.data);
};

// this is used by master process only
// this function is called from src/process
module.exports.handleRequest = function (worker, cmdMsg) {

	if (!cmdMsg || !cmdMsg.cid || !cmdMsg.cmd || cmdMsg.response) {
		// it is not command or it is a response
		return;
	}

	var handler = commandHandlers[cmdMsg.cmd];

	if (!handler) {
		logger.error('Request command handler not found for command:', cmdMsg.cmd);
		return;
	}

	handler(cmdMsg.data, function (error, res) {
		var resp = module.exports.createRes(cmdMsg.cid, error, res);
		msg.send(resp, worker);
	});	
};
