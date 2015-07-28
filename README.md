# cluster-mode

©Nobuyori Takahashi < voltrue2@yahoo.com >

A cluster process management module for node.js application.

This module's intention is not to replace the built-in `cluster` module, but to extend it for usability and functionality.

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

***

## Methods

Avialable functions of this module.

### .addShutdownTask(task [Function], runOnMaster [*Boolean])

Adds a function to be executed before your application process exits.

Task function will recieve 1 argument, a callback function.

It is useful when you need to clean up your application before terminating the prrocess.

If `runOnMaster` is set to `false`, the shutdown task function will **NOT** be executed on master process.

The default value of `runOnMaster` is `true`.

**NOTE:** The function returns a boolean. When the function succeeds in adding a new shutdown task function, it returns `true`.

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

***

## Events

`cluster-mode` module is also an event emitter.

### cluster

Emitted when your application process starts.

This event will be called when: master process is ready, worker process is ready or non-cluster process is ready.

When master process is ready,  the callback will recieve two arguments: `"master.ready"` and `pid`.

When worker process is ready,  the callback will recieve two arguments: `"worker.ready"` and `pid`.

When non-cluster process is ready,  the callback will recieve one argument: `"non.ready"`.

### cluster.master.ready

Emitted when your cluster master process is ready.

The callback will be passed the PID of the process.

### cluster.worker.ready

Emitted when your cluster worker process is ready.

The callback will be passed the PID of the process.

### cluster.non.ready

Emitted when your non-cluster process is ready

### auto.spawn

Emitted when a worker is auto re-spawned.

### reload

Emitted when your cluster application is reloading.

When each worker process is reloaded: the callback function will recieve three arguments: `"reloading"`, `pid`, and `worker id`.

When reload is complete: the callback function will recieve one argument: '"complete"'.

### reload.reloading

Emitted when your cluster application is reloading.

The event is emitted on each worker process reload.

Your callback function recieves two arguments: `pid` and `worker id`.

### reload.complete

Emitted when your cluster process has completed realoding

### exit

Emitted when your process is about to exit

