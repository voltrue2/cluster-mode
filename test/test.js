var prcs = require('../index');

//var logger = require('bunyan').createLogger({ name: 'test' });
//var logger = require('winston');
var logger = require('gracelog').create('test');

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

prcs.start(config);

setInterval(function () {

}, 10000);
