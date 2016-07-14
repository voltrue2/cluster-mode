# Change Log

This is a list of manually maintained changes and updates for each version.

## Version 1.0.2

## Added

None

## Changed

#### Corrected error message for missing callback on send and receive

## Deprecated

None

## Removed

None

***

## Version 1.0.1

## Added

None

## Changed

#### Bug fix: Uncaught exception fixed when exiting clustered child processes

## Deprecated

None

## Removed

***

## Version 1.0.0

## Added

#### .sendCommand() added

#### .registerCommand() added

#### .registerRole() added

#### .unregisterRole() added

#### .sendToRole() added

## Changed

#### .start() has optional callback function

```javascript
var cluster = require('cluster-mode');
cluster.start(config, function () {
	// process is now ready
});
```

## Deprecated

None

## Removed

None

***

## Version 0.2.4

## Added

None

## Changed

#### Bug fix when starting with 1 worker

## Deprecated

None

## Removed

None

## Version 0.2.3

## Added

None

## Changed

#### Removed unnecessary JSON parsing

#### Removed warning logs for none JSON messages

## Deprecated

None

## Removed

None

## Version 0.2.2

## Added

None

## Changed

#### Removed async as dependency

## Deprecated

None

## Removed

None

***

Version 0.2.0

## Added

None

## Changed

#### Bug fix on error exit

The porcess was not exiting with exit code 1 when an error object is passed.

## Deprecated

None

## Removed

None

***

Version 0.0.12

## Added

None

## Changed

#### Minor Refactoring in src/process.js and lib/msg.js

## Deprecated

None

## Removed

None

***

Version 0.0.11

## Added

#### .getWorkerIdByPid() added

#### .getWorerPidById() added

## Changed

#### The value of sync in configuration object will always be false if run in non-cluster

## Deprecated

None

## Removed

None

***

Version 0.0.10

## Added

#### .send() added

Sends a message object to a specific worker process.

The sent message can be caught by `message` event in the targeted worker process.

#### message event added

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

#### sync event added

Emitted when worker map is synced.

The callback will be passed the worker map (Same map as .getWorkers() would return).

**NOTE:** If `sync` option is set to `false` in the configuration object for `.start()`, the event will NOT be emitted.

#### sync flag added to configuration object for .start()

**Default Configurations**

```
{
        max: <number of CPU available>,
        log: null,
        autoSpawn: false,
        sync: true
}
```

## Changed

None

## Deprecated

None

## Removed

None

***

Version 0.0.9

## Added

#### .getWorkers() added

#### Shutting down steps now ignores multiple exit instructions while shutting down

## Changed

#### Logging added warn

## Deprecated

None

## Removed

None

***

Version 0.0.8

## Added

None

## Changed

#### BUG fix: Auto-respawning now works without signaled exit

#### Default logging now has timestamp

#### .stop() improved error logging

#### Exit code mapping improved

#### Private function .exit() now recieves an error

## Deprecated

None

## Removed

None

***

Version 0.0.7

## Added

#### .stop() added

With `.stop()`, you can stop the process programatically.

## Changed

None

## Deprecated

None

## Removed

None

***

Version 0.0.6

## Added

None

## Changed

#### .addShutdownTask() now has 2nd argument

With the 2nd argument `runOnMaster` set to `false`, the shutdown task function(s) will NOT be executed on master process.

The default is `true`.

## Deprecated

None

## Removed

None

***

Version 0.0.5

## Added

##### A new event added

`cluster`, `reload``

## Changed

##### .addShutdownTask() now returns a boolean

#### auto.spawn event will pass pid and worker ID to the callback

## Deprecated

None

## Removed

None

***

## Version 0.0.4

## Added

##### Events added

`cluster.master.ready`, `cluster.worker.ready`, `cluster.non.ready`, `auto.spawn`, `reload.complete`, and `exit` are added.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.0.3

## Added

##### .isCluster() added

## Changed

##### Minor refactoring of src/proecss.js

##### Improved log output for auto re-apawn of workers

## Deprecated

None

## Removed

None 

***

## Version 0.0.2

## Added

None

## Changed

##### autoSpawn now has minimum required worker life time for auto re-spawn

In cluster mode w/ autoSpawn = true: a worker dies in less than 10 seconds -> reload application process w/ SIGHUP -> terminate application process -> the application process does not die.

## Deprecated

None

## Removed

None

***

## Version 0.0.1

Very first released version. Please refer to README.

***
