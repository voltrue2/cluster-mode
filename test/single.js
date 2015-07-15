var cluster = require('../');

var config = {
	max: 0
};

cluster.on('cluster.non.ready', function () {
	console.log('READY!!!!');
});

cluster.on('exit', function () {
	console.log('EXIT!!!!!');
});

cluster.addShutdownTask(function (cb) {
	cb();
});

cluster.addShutdownTask(function (cb) {
	console.log('wait for 3 seconds');
	setTimeout(function () {
		cb();
	}, 3000);
});

cluster.start(config);

setInterval(function () {

}, 10000);
