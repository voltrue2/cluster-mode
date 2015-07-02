# cluster-mode

©Nobuyori Takahashi < voltrue2@yahoo.com >

A cluster process management module for node.js application.

This module's intention is not to replace the built-in `cluster` module, but to extend it for usability and fanctionality.

## How To Install

```
npm install cluster-mode
```

## How To Use

```javascript
var cluster = require('cluster-mode');
var config = {
	max: 8 // start the application with 8 workers
	log: require('bunyan').createLogger({ name: 'myClusterApp' })
};
cluster.start(config);
```

## Methods

Avialable functions of this module.

### .addShutdownTask(task [Function])

Adds a function to be executed before your application process exits.

Task function will recieve 1 argument, a callback function.

It is useful when you need to clean up your application before terminating the prrocess.

Exmaple:

```javascript
var cluster = require('cluster-mode');
cluster.addShutdownTask(function (cb) {
	// do what needs to be done
	// when all is finished, move on to next
	cb();
});
```

### .start(config [*Object])

You must invoke this function in order to start your application process.

If you do not pass `config`, `cluster-mode` will fall back to its default settings:

Default

```
{
	max: <number of CPU available>,
	log: null,
	autoSpawn: false
}
```

#### Config Object

```
{
	max: <number> // max number of worker processes to spawn
	log: <object> // logging module object. cluster-mode supports bunyan, winston, log4js, and gracelog
	autoSpawn: <boolean> // automatically re-spawn dead worker processes
}
```

##### max (Required)

This property manages the number of worker processes you want to start with.

**NOTE:** Set this value to `0` to start your application in **non-cluster** mode (no workers).

##### log (Optional)

`cluster-mode` module supports, `bunyan`, `winston`, `log4js` and `gracelog`.

##### autoSpawn (Optional)

If set to `true`, `cluster-mode` will automatically re-spawn a new worker to take place of the dead worker.

If workers die in less than **10** seconds, however, it will consider, there is something wrong with the application and will **NOT** re-spawn a new worker.

### .isMaster()

Returns `true` if your process is in `cluster-mode` (with workers) **and** a master process.

### .isCluster()

Returns `true` if your process is running with workers.
