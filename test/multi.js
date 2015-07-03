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

prcs.addShutdownTask(function (cb) {
	setTimeout(function () {
		cb();
	}, 1);
});

prcs.addShutdownTask(function (cb) {
	setTimeout(function () {
		cb();
	}, 1);
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

prcs.on('exit', function () {
	console.log('----> Event: exit!!!!!!!!!!!');
});

prcs.start(config);

setInterval(function () {

}, 10000);
