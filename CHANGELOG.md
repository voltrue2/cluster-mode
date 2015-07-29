# Change Log

This is a list of manually maintained changes and updates for each version.

***

Version 0.0.8

### Added

None

### Changed

#### BUG fix: Auto-respawning now works without signaled exit

#### .stop() improved error logging

#### Exit code mapping improved

#### Private function .exit() now recieves an error

### Deprecated

None

### Removed

None

***

Version 0.0.7

### Added

#### .stop() added

With `.stop()`, you can stop the process programatically.

### Changed

None

### Deprecated

None

### Removed

None

***

Version 0.0.6

### Added

None

### Changed

#### .addShutdownTask() now has 2nd argument

With the 2nd argument `runOnMaster` set to `false`, the shutdown task function(s) will NOT be executed on master process.

The default is `true`.

### Deprecated

None

### Removed

None

***

Version 0.0.5

### Added

##### A new event added

`cluster`, `reload``

### Changed

##### .addShutdownTask() now returns a boolean

#### auto.spawn event will pass pid and worker ID to the callback

### Deprecated

None

### Removed

None

***

## Version 0.0.4

### Added

##### Events added

`cluster.master.ready`, `cluster.worker.ready`, `cluster.non.ready`, `auto.spawn`, `reload.complete`, and `exit` are added.

### Changed

None

### Deprecated

None

### Removed

None

***

## Version 0.0.3

### Added

##### .isCluster() added

### Changed

##### Minor refactoring of src/proecss.js

##### Improved log output for auto re-apawn of workers

### Deprecated

None

### Removed

None 

***

## Version 0.0.2

### Added

None

### Changed

##### autoSpawn now has minimum required worker life time for auto re-spawn

In cluster mode w/ autoSpawn = true: a worker dies in less than 10 seconds -> reload application process w/ SIGHUP -> terminate application process -> the application process does not die.

### Deprecated

None

### Removed

None

***

## Version 0.0.1

Very first released version. Please refer to README.

***
