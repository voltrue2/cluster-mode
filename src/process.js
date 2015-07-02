'use strict';

var os = require('os');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var cluster = require('cluster');
var logger = require('../lib/logger');
var msg = require('../lib/msg');
var sigCode = require('../lib/sigcode');

// default number of max workers to start
var MAX = os.cpus().length;
// singlals
var SIGNALS = {
	SIGHUP: 'SIGHUP',
	SIGINT: 'SIGINT',
	SIGQUIT: 'SIGQUIT',
	SIGTERM: 'SIGTERM'
};
// reload command
var CMD = {
	RELOAD: 'reload',
	EXIT: 'exit'
};
// minimum lifespan for workers
// workers must be alive for at least 1 second
// otherwise it will NOT be auto re-spawn
var MIN_LIFE = 10000;
// number of works to start
var numOfWorkers = 0;
// auto respawn workers when they die
var autoSpawn = false;
// flags
var isReloading = false;
var isShutdown = false;
var isMaster = false;
// counter
var reloaded = 0;
// shutdown tasks to be executed before shutting down
var shutdownTasks = [];
// worker map used for master process only
var workerMap = {};

exports.addShutdownTask = function (task) {

	if (typeof task !== 'function') {
		// TODO: log something
		return;
	}

	shutdownTasks.push(task);
};

exports.start = function (config) {

	if (cluster.isMaster) {
		// either non-cluster or master
		isMaster = true;
		logger.setName('MASTER: ' + process.pid);
	} else {
		logger.setName('WORKER: ' + process.pid);
	}

	// check config
	if (!config) {
		config = {};
	}
	// set logger if provided
	logger.set(config.logger);
	// decide how many workers to start
	// if this is 0, we run in non-cluster mode
	numOfWorkers = (config.max === 0) ? 0 : config.max || MAX;
	// auto re-spawn dead workers or not
	autoSpawn = config.autoSpawn || false;

	if (isMaster) {
		logger.info('Number of workers: ' + numOfWorkers);
		logger.info('Auto re-spawn: ' + autoSpawn);
	}

	// start cluster process
	start();
};

exports.isMaster = function () {
	if (isMaster && numOfWorkers) {
		return true;
	}
	return false;
};

function start() {
	startListeners();
	var inClusterMode = startClusterMode();
	if (isMaster) {
		logger.info('Staring in cluster mode: ' + inClusterMode);
	}
}

function startClusterMode() {
	if (numOfWorkers > 1) {
		// cluster mode
		switch (cluster.isMaster) {
			case true:
				startMaster();
				break;
			case false:
				startWorker();
				break;
		}
		return true;
	}
	// non cluster mode
	startListeners();
	return false;
}

function startListeners() {

	logger.info('Start listeners');

	process.on(SIGNALS.SIGHUP, reload);
	process.on(SIGNALS.SIGINT, function () {
		exit(SIGNALS.SIGINT);
	});
	process.on(SIGNALS.SIGQUIT, function () {
		exit(SIGNALS.SIGQUIT);
	});
	process.on(SIGNALS.SIGTERM, function () {
		exit(SIGNALS.SIGTERM);
	});
	process.on('exit', function (code) {
		if (code) {
			// some kind of error
			var errorName = sigCode.getNameByExitCode(code);
			logger.error('Error termination: (code: ' + code + ')', errorName);
		}
	});
}

function startMaster() {

	logger.info('Starting master process');

	// spawn workers
	for (var i = 0; i < numOfWorkers; i++) {
		createWorker();
	}
	// set up process termination listener on workers
	cluster.on('exit', handleWorkerExit);
}

function createWorker() {
	var worker = cluster.fork();
	// add it to the map
	workerMap[worker.id] = {
		started: Date.now(),
		pid: worker.process.pid
	};
	// master to worker message listener
	worker.on('message', function (data) {
		try {
			data = JSON.parse(data);
		} catch (e) {
			// TODO: do we need to do something here?
		}
	});

	logger.info('Worker (ID: ' + worker.id + ') [pid: ' + worker.process.pid + '] created');
}

function handleWorkerExit(worker, code, sig) {

	logger.info(
		'Cluster process is exiting <signal: ' +
		sigCode.getNameByExitCode(code) + ', ' + sig +
		'> (worker: ' + worker.id + ') [pid: ' + worker.process.pid + ']: ' +
		Object.keys(cluster.workers).length + '/' + numOfWorkers 
	);

	// keep the copy
	var workerData = workerMap[worker.id];
	// remove from the map
	delete workerMap[worker.id];

	// this is for master process
	if (isReloading) {
		handleReloading();
		return;
	}
	// this is for master process
	if (!worker.suicide && sig && autoSpawn) {
		handleAutoSpawn(worker, workerData, code, sig);
		return;
	}
	// this is for master process
	if (noMoreWorkers()) {
		// no more workers and shutting down
		// or no more workers with code greater than 0
		logger.info(
			'No more workers running (shutdown: ' + isShutdown +
			') [code: ' + sigCode.getNameByExitCode(code) + ', ' + code + ']'
		);
		if (isShutdown || code) {
			logger.info('All worker processes have gracefully disconnected');
			shutdown();
		}
		return;
	}

	// worker disconnected for exit
	emitter.emit('workerExit');
}

function handleAutoSpawn(worker, workerData, code, sig) {
	// worker died from an error
	// auto-respawn the dead worker
	// if master wants to shutdown, workers don't auto re-spawn
	if (!isShutdown) {
		logger.error(
			'A worker process exited unxpectedly (worker: ' +
			worker.id + ') [pid: ' + workerData.pid + '] [code: ' +
			sigCode.getNameByExitCode(code) +
			'] [signal: ' + sig + ']'
		);
		if (Date.now() - workerData.started < MIN_LIFE) {
			// number of worker process has permanently decreased 
			numOfWorkers -= 1;
			logger.error(
				'A worker process must be alive for at least ' + MIN_LIFE + 'ms ' +
				'(# of worker: ' + numOfWorkers + ')'
			);
			return;
		}
		createWorker();
		logger.info('Auto re-spawned a new worker process');
	}
	return;
}

function handleReloading() {
	createWorker();

	emitter.emit('reloaded');
	
	reloaded += 1;
	
	logger.info('Reloaded a worker process');

	// done and reset
	if (reloaded === numOfWorkers) {
		isReloading = false;
		reloaded = 0;
		
		logger.info('All worker processes have reloaded');
	}
}

function startWorker() {
	// set up message lsitener: worker to master
	process.on('message', function (data) {
		try {
			data = JSON.parse(data);
		} catch (e) {
			// TODO: do something here?
		}
		switch (data.command) {
			case CMD.EXIT:
				logger.info('Shutting down worker process for exit');
				shutdown();
				break;
			case CMD.RELOAD:
				logger.info('Shutting down worker process for reload');
				shutdown();
				break;
			default:
				logger.error('Unknown command from master process: ' + data.command);
				break;
			
				
		}
	});

	logger.info('Worker process started [pid: ' + process.pid + ']');
}

function reload() {

	if (!isMaster) {
		// this is master only
		return;
	}
	logger.info(
		'Reloading (# of workers: ' +
		Object.keys(cluster.workers).length + ')'
	);

	// more than 1 worker
	if (numOfWorkers) {
		// initialize flag and counter
		isReloading = true;
		reloaded = 0;
		// send reload command to each worker one at a time
		var keys = Object.keys(cluster.workers);
		var done = function () {
			// done
		};
		async.eachSeries(keys, function (id, next) {
			// this is the callback
			// when the worker is reloaded
			emitter.once('reloaded', next);
			// send reload command
			msg.send({ command: CMD.RELOAD }, cluster.workers[id]);
		}, done);
	}
}

function exit(sig) {

	if (!isMaster) {
		// this is master only
		return;
	}

	logger.info(
		'Exiting [signal: ' + sig + '] (# of workers: ' +
		Object.keys(cluster.workers).length + ')'
	);

	if (numOfWorkers && cluster.isMaster) {
		// master will wait for all workers to exit
		isShutdown = true;
		if (noMoreWorkers()) {
			// all workers have exited
			// now exit master

			logger.info('Master is exiting');

			shutdown();
			return;
		}
		// there are more workers
		// instruct them to disconnect and gracefuly exit
		var keys = Object.keys(cluster.workers);
		async.eachSeries(keys, function (id, next) {
			emitter.once('workerExit', next);
			logger.info(
				'Instruct worker process to exit: ' +
				'(worker: ' + id + ') '
			);
			msg.send({ command: CMD.EXIT }, cluster.workers[id]);
		});
		return;
	}
	// we don't have workers to begin with
	if (!numOfWorkers) {
		shutdown();
	}
}

function shutdown() {
	var counter = 0;
	var done = function (error) {
		var code = 0;
		if (error) {
			code = 1;
		}

		logger.info('Exit: PID - ' + process.pid);

		process.exit(code);
	};

	logger.verbose(
		'Number of shutdown tasks before shutting down: ' +
		shutdownTasks.length
	);

	async.eachSeries(shutdownTasks, function (task, next) {

		counter += 1;

		logger.info(
			'Execute shutdown task:',
			counter + ' out of ' + shutdownTasks.length
		);

		task(next);
	}, done);
}

function noMoreWorkers() {
	return !Object.keys(cluster.workers).length;
}
