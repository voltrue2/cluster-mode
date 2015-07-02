# Change Log

This is a list of manually maintained changes and updates for each version.

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
