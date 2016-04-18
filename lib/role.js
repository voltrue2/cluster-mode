'use strict';

// one role per worker

var logger = require('./logger');
var roles = {};

module.exports.registerRole = function (roleName, workerId) {
	if (!workerId) {
		return false;
	}
	for (var id in roles) {
		if (roles[id] === workerId) {
			return false;
		}
	}
	if (!roles[roleName]) {
		roles[roleName] = workerId;
		logger.info('Registered a role:', roleName, 'to:', workerId);
		return true;
	}
	return false;
};

module.exports.unregisterRole = function (roleName) {
	if (roles[roleName]) {
		logger.info('Unregistered a role:', roleName, 'from:', roles[roleName]);
		delete roles[roleName];
	}
};

// called automatically from src/process master when the worker dies
module.exports.unregisterWorker = function (workerId) {
	var role = module.exports.getRoleByWorkerId(workerId);
	if (role) {
		module.exports.unregisterRole(role);
	}
};

module.exports.getRoleByWorkerId = function (workerId) {
	for (var roleName in roles) {
		if (roles[roleName] === workerId) {
			return roleName;
		}
	}
	return null;
};

module.exports.getWorkerIdByRole = function (roleName) {
	return roles[roleName] || null;
};
