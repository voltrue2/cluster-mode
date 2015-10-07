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
	logger: require('bunyan').createLogger({ name: 'myClusterApp' })
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
var success = cluster.addShutdownTask(function (cb) {
	// do what needs to be done
	// when all is finished, move on to next
	cb();
}, false);

// success would be true, if it added the task function
// false means that is task function will NOT be executed on master process
```

### .onExit(task [Function])

Assigns a function to be executed at the moment of exitting of the application process.

The difference from `.addShutdownTask()` is that `.onExit()` will be executed after all shutdown tasks. 

### .start(config [*Object])

You must invoke this function in order to start your application process.

If you do not pass `config`, `cluster-mode` will fall back to its default settings:

**Default**

```
{
	max: <number of CPU available>,
	log: null,
	autoSpawn: false,
	sync: true
}
```

#### Config Object

```
{
	max: <number> // max number of worker processes to spawn
	log: <object> // logging module object. cluster-mode supports bunyan, winston, log4js, and gracelog
	autoSpawn: <boolean> // automatically re-spawn dead worker processes
	sync: <boolean> // synchronize worker map: default is true
}
```

##### max (Required)

This property manages the number of worker processes you want to start with.

**NOTE:** Set this value to `0` to start your application in **non-cluster** mode (no workers).

##### logger (Optional)

`cluster-mode` module supports, `bunyan`, `winston`, `log4js` and `gracelog`.

##### autoSpawn (Optional)

If set to `true`, `cluster-mode` will automatically re-spawn a new worker to take place of the dead worker.

If workers die in less than **10** seconds, however, it will consider, there is something wrong with the application and will **NOT** re-spawn a new worker.

##### sync (Optional)

A boolean flag to turn on/off auto-synchronization of worker map among all worker processes.

The default is `true`.

### .stop(error [*Error Object])

If invoked from cluster worker, it will send a request to terminate the process to master.

**NOTE:** If an error object is passed, cluster-module will log an error log and terminates the process with `FATAL ERROR`.

### .isMaster()

Returns `true` if your process is in `cluster-mode` (with workers) **and** a master process.

### .isCluster()

Returns `true` if your process is running with workers.

### .getWorkers()

If `sync` option in configuration object for `.start()` is `true`, It will return the worker map, but if it is `false`, it will return an empty object.

Returns a map of all available workers.

The keys of the map are worker IDs.

**NOTE:** The map is synchronized from master process asynchronously.

### .send(workerId [number], message [object])

Sends a message object to a specific worker process.

The sent message can be caught by `message` event in the targeted worker process.

### .getWorkerIdByPid(pid [number])

Returns the pid of a worker by the pid(process ID) given.

If invalid pid is given, the function will return `null`.

**NOTE:** If `sync` of the configuration is `false`, the function returns `null`.

### .getWorkerPidById(workerId [number])

Returns the pid (process ID) of a worker by the ID (worker ID) given.

If invalid ID is given, the function will return `null`.

**NOTE:** If `sync` of the configuration is `false`, the function returns `null`.

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

Emitted when your non-cluster process is ready.

### sync

Emitted when worker map is synced.

The callback will be passed the worker map (Same map as .getWorkers() would return).

**NOTE:** If `sync` option is set to `false` in the configuration object for `.start()`, the event will NOT be emitted.

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

Emitted when your cluster process has completed realoding.

### message

The event is emitted when the process recieves a message object from another cluster process by `.send()`.

The callback will be passed the message object.

Message Object Structure:

```
{
	from: <worker ID>/<string "master">
	msg: <message data>
}
```

Example Code:

```javascript
var cluster = require('cluster-mode');
cluster.on('message', function (data) {
	console.log('message was sent from', data.from);
	console.log('sent message is', data.msg);
});
```

### exit

Emitted when your process is about to exit.

The callback of this event will recieve two arguments: `code` and `signal`.

`code`: 0 for expected exit and 1 for exiting with an error.

`signal`: If the process is exiting by a signal such as `SIGINT`.

**NOTE:** Catching this event does **NOT** prevent the process from exiting.

