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
var PREFIX = 'cLuSToR-mOdE';
var CMD = {
	RELOAD: PREFIX + '__reload__',
	EXIT: PREFIX + '__exit__',
	SYNC: PREFIX + '__sync__'
};
// minimum lifespan for workers
// workers must be alive for at least 10 second
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
var shutdownLock = false;
// counter
var reloaded = 0;
// shutdown tasks to be executed before shutting down
var shutdownTasks = [];
// worker map used for master process only, but synced from master to workers
var workerMap = {};

var ee = new EventEmitter();

ee.addShutdownTask = function (task, runOnMaster) {

	if (typeof task !== 'function') {
		return false;
	}

	// default value of runOnMaster is true
	if (runOnMaster === undefined) {
		runOnMaster = true;
	}

	shutdownTasks.push({ task: task, runOnMaster: runOnMaster });

	return true;
};

ee.start = function (config) {

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

ee.getWorkers = function () {
	var map = {};
	for (var id in workerMap) {
		map[id] = {
			pid: workerMap[id].pid,
			started: workerMap[id].started
		};
	}
	return map;
};

ee.stop = function (error) {
	exit(error, error ? sigCode.CODES.FATAL_ERROR : sigCode.CODES.EXPECTED);
};

ee.isMaster = function () {
	if (isMaster && numOfWorkers) {
		return true;
	}
	return false;
};

ee.isCluster = function () {
	if (numOfWorkers) {
		return true;
	}
	return false;
};

module.exports = ee;

function start() {
	startListeners();
	var inClusterMode = startClusterMode();
	if (isMaster) {
		logger.info('Starting in cluster mode: ' + inClusterMode);
	}
}

function startClusterMode() {
	if (numOfWorkers > 1) {
		// cluster mode
		switch (cluster.isMaster) {
			case true:
				startMaster();
				ee.emit('cluster', 'master.ready', process.pid);
				ee.emit('cluster.master.ready', process.pid);
				break;
			case false:
				startWorker();
				ee.emit('cluster', 'worker.ready', process.pid);
				ee.emit('cluster.worker.ready', process.pid);
				break;
		}
		return true;
	}
	// non cluster mode
	ee.emit('cluster', 'non.ready');
	ee.emit('cluster.non.ready');
	return false;
}

function startListeners() {

	logger.info('Start listeners');

	process.on(SIGNALS.SIGHUP, reload);
	process.on(SIGNALS.SIGINT, function () {
		exit(null, SIGNALS.SIGINT);
	});
	process.on(SIGNALS.SIGQUIT, function () {
		exit(null, SIGNALS.SIGQUIT);
	});
	process.on(SIGNALS.SIGTERM, function () {
		exit(null, SIGNALS.SIGTERM);
	});
	process.on('exit', function (code) {
		if (code) {
			// some kind of error
			var errorName = sigCode.getNameByExitCode(code);
			logger.error('Error termination: (code: ' + code + ') ' + errorName);
		}
	});
}

function startMaster() {

	logger.info('Starting master process');

	// set up process termination listener on workers
	cluster.on('exit', handleWorkerExit);
	// spawn workers
	for (var i = 0; i < numOfWorkers; i++) {
		createWorker();
	}
}

function createWorker() {
	var worker = cluster.fork();
	// add it to the map
	workerMap[worker.id] = {
		started: Date.now(),
		pid: worker.process.pid
	};
	// worker to master message listener
	worker.on('message', function (data) {
		try {
			data = JSON.parse(data);
		} catch (e) {
			logger.warn('Message data not JSON:', data);
		}
	});

	logger.info('Worker (ID: ' + worker.id + ') [pid: ' + worker.process.pid + '] created');

	// sync worker map with all workers
	msg.send({ command: CMD.SYNC, map: workerMap });

	return worker;
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
	
	// sync worker map with all workers
	msg.send({ command: CMD.SYNC, map: workerMap });

	// this is for master process
	if (isReloading) {
		handleReloading();
		return;
	}
	// this is for master process
	if (!worker.suicide && autoSpawn) {
		handleAutoSpawn(worker, workerData, code, sig);
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
			logger.info('All worker processes have disconnected');
			shutdown(null, code);
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
				' (ID: ' + worker.id + ') [pid: ' + worker.process.pid + ']' +
				'(# of worker: ' + numOfWorkers + '): no auto-respawning'
			);
			return;
		}
		var newWorker = createWorker();
		ee.emit('auto.spawn', newWorker.process.pid, newWorker.id);
	} else {
		logger.info(
			'Master process is instructing to shutdown (ID: ' + worker.id + ') [pid: ' +
			worker.process.pid + ']: no auto-respawning'
		);
	}
	return;
}

function handleReloading() {
	var worker = createWorker();

	emitter.emit('reloaded');
	
	reloaded += 1;
	
	logger.info(
		'Reloaded a worker process (ID: ' +
		worker.id + ') [pid: ' + worker.process.pid + ']'
	);

	ee.emit('reload', 'reloading', worker.process.pid, worker.id);
	ee.emit('reload.reloading', worker.pid, worker.id);

	// done and reset
	if (reloaded === numOfWorkers) {
		isReloading = false;
		reloaded = 0;
		ee.emit('reload', 'complete');
		ee.emit('reload.complete');
		logger.info('All worker processes have reloaded');
	}
}

function startWorker() {
	// set up message lsitener: master to worker
	process.on('message', function (data) {
		try {
			data = JSON.parse(data);
		} catch (e) {
			logger.warn('Message data not JSON:', data);
		}

		if (!data.command) {
			// not a command message
			return;
		}

		switch (data.command) {
			case CMD.EXIT:
				logger.info('Shutting down worker process for exit');
				shutdown();
				return;
			case CMD.RELOAD:
				logger.info('Shutting down worker process for reload');
				shutdown();
				return;
			case CMD.SYNC:
				logger.info('Synchronize worker map');
				logger.verbose('synched map:', data.map);
				workerMap = data.map;
				return;
			default:
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

function exit(errorExit, sig) {

	if (!isMaster) {
		// this is master only
		return;
	}

	if (shutdownLock) {
		logger.warn('Process is already shutting down: This exit instruction is ignored');
		if (errorExit) {
			logger.error('Exit instruction by error:' + errorExit.message + '\n' + errorExit.stack);
		}
		return;
	}

	shutdownLock = true;
	
	if (errorExit) {
		logger.error(
			'Exiting with an error [signal: ' + sig +
			' ' + sigCode.getNameByExitCode(sig) + '] (# of workers: ' +
			Object.keys(cluster.workers).length + '): ' + (errorExit.stack || null)
		);
	} else {
		logger.info(
			'Exiting [signal: ' + sig + ' ' + sigCode.getNameByExitCode(sig) + '] (# of workers: ' +
			Object.keys(cluster.workers).length + ')'
		);
	}

	if (numOfWorkers && cluster.isMaster) {
		// master will wait for all workers to exit
		isShutdown = true;
		if (noMoreWorkers()) {
			// all workers have exited
			// now exit master

			logger.info('Master is exiting');

			shutdown(sig);
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
			msg.send({ command: CMD.EXIT, error: errorExit }, cluster.workers[id]);
		});
		return;
	}
	// we don't have workers to begin with
	if (!numOfWorkers) {
		shutdown(errorExit, sig);
	}
}

function shutdown(errorShutdown, sig) {
	var counter = 0;
	var taskList = shutdownTasks.filter(function (item) {
		if (ee.isMaster()) {
			// run tasks with runOnMaster=true only on master
			return item.runOnMaster;
		} else {
			// run all tasks
			return true;
		}
	});
	var done = function (error) {
		var code = 0;
		if (error) {
			code = 1;
		}

		logger.info('Exit: PID - ' + process.pid);

		ee.emit('exit', code, sig || null);

		process.exit(code);
	};

	logger.verbose(
		'Number of shutdown tasks before shutting down: ' +
		taskList.length
	);

	async.eachSeries(taskList, function (item, next) {

		counter += 1;

		logger.info(
			'Execute shutdown task:',
			counter + ' out of ' + taskList.length
		);

		item.task(next);
	}, done);
}

function noMoreWorkers() {
	return !Object.keys(cluster.workers).length;
}
