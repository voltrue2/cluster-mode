var prcs = require('../index');

var logger;
//var logger = require('bunyan').createLogger({ name: 'test' });
//var logger = require('winston');
//var logger = require('gracelog').create('test');

var config = {
	max: 4,
	logger: logger,
	autoSpawn: true
};

prcs.addShutdownTask(function hundred(cb) {
	setTimeout(function () {
		cb();
	}, 100);
}, false);

prcs.addShutdownTask(function threeHundred(cb) {
	setTimeout(function () {
		cb();
	}, 300);
});

prcs.on('cluster', function (state, pid) {
	console.log('cluster state:', state, pid);
});

prcs.on('cluster.non.ready', function () {
	console.log('----> Event: non cluster is ready!!!');
});

prcs.on('cluster.worker.ready', function (pid) {
	console.log('----> Event: worker process is ready!!!', pid);
});

prcs.on('cluster.master.ready', function (pid) {
	console.log('----> Event: master process is ready!!!', pid);
});

prcs.on('auto.spawn', function (pid, id) {
	console.log('auto-spawned: ', pid, id);
});

prcs.on('reload', function (state, pid, id) {
	console.log('reload:', state, pid, id);
});

prcs.on('exit', function (code, sig) {
	console.log('----> Event: exit!!!!!!!!!!!', code, sig);
});

prcs.start(config);


if (!prcs.isMaster()) {
	setTimeout(function () {
		console.error('die in 5 seconds');
		throw new Error('exception and die...');
	}, 5000);
}

setInterval(function () {
}, 3000);
