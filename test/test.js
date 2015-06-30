var prcs = require('../index');

var config = {
	max: 4
};

prcs.addShutdownTask(function (cb) {
	setTimeout(function () {
		cb();
	}, 1);
});

prcs.start(config);

setInterval(function () {

}, 10000);
