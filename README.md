# xbee-promise
#### An XBee promise-based API

The [xbee-promise](http://github.com/101100/xbee-promise/) [Node.js](http://nodejs.org/)
module wraps the [xbee-api](http://github.com/jouz/xbee-api/) module with a promise-based
API for [ZigBee](http://en.wikipedia.org/wiki/ZigBee) modules.  It may work with older
[802.15.4](http://en.wikipedia.org/wiki/IEEE_802.15.4) modules, but it has not been
tested with them.  Currently it facilitates local commands, remote commands, and remote
transmissions.  For remote commands and transmissions, either a address or node ID may be
provided, with automatic lookup and aching done for the node ID.

xbee-promise relies on
[serialport](https://github.com/voodootikigod/node-serialport) for serial communications.

## Usage

First, you will need to install the `xbee-promise` module (i.e.
`npm install xbee-promise`).

### Initialization

To create a connection to your module, you will need to know the serial port that
it is connected to.  On Windows, this typically has the form `COMx`, where `x` is
a number.  On unix and OS X machines, this will typically be `/dev/tty???`, where
`???` can be anything from `USB0` to `.usbserial-A4013E5P`. In addition, you will
need to make sure that the module connected to your machine is in API mode and that
you know the baudrate it is set to.  By default, the baudrate is 57600 when API
mode is used.  Once these details are known, you can initialize xbee-promise:

```javascript
var xbeePromise = require('xbee-promise');

var xbee = xbeePromise({
    serialport: '/dev/ttyUSB0',
    serialPortOptions: {
        baudrate: 57600
    }
});
```

Note: if you are using API mode 2, you must specify that with the `api_mode` parameter
(`api_mode: 2`).  You can give any options
[known by serialport](https://github.com/voodootikigod/node-serialport#to-use) inside
`serialportOptions` (other than `parser` as it is used and set by xbee-promise).  To see
what the library is doing (during lookups, etc), you can add the debug flag
(`debug: true`).  Finally, you can set the default timeout for all commands with
`defaultTimeout`.  The default is 5000 milliseconds.

### Local commands

Local commands may be performed using the `localCommand` fuction.  They can be query
commands (no parameters) or set commands (with parameters).

```javascript
xbee.localCommand({
    // ATMY
    // get my 16 bit address
    command: "MY"
}).then(function (response) {
    // response will be an array of two bytes, e.g. [ 23, 167 ]
    console.log("ATMY response:\n", response);
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```


```javascript
xbee.localCommand({
    // ATD1 5
    // turn digital output 1 on
    command: "D1",
    commandParameter: [ 5 ]
}).then(function (response) {
    // response will be [ 0 ] from the response frame
    console.log("Success!");
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```

### Remote commands

Remote commands may be performed using the `remoteCommand` fuction.  They are similar
to local commands, but must have either a `destination64` 64 bit address or a
`destinationId` node ID to indicate the target of the command.

```javascript
xbee.remoteCommand({
    // ATD0
    // get the status of digital pin 0
    command: "D0",
    // this ID must be set on the target node with ATNI
    destinationId: "FUNNODE"
}).then(function (response) {
    // response will be a single value in an array, e.g. [ 1 ]
    console.log("ATD0 response from FUNNODE:\n", response);
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```


```javascript
xbee.remoteCommand({
    // ATD1 4
    // Turn digital output 1 off
    command: "D1",
    commandParameter: [ 4 ],
    // serial number from the bottom of the module (or combination of ATSH and ATSL)
    destination64: '0013a20040a099a1'
}).then(function (response) {
    // response will be [ 0 ] from the response frame
    console.log("Success!");
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```

### Remote transmission

Remote commands may be performed using the `remoteTransmit` fuction.  The destination
is set in the same manner as for remote commands.  The text to send is given with
the `data` parameter.

```javascript
xbee.remoteTransmit({
    // this ID must be set on the target node with ATNI
    destinationId: "FUNNODE",
    data: "I'm sending you text, FUNNODE!"
}).then(function (response) {
    // response will be true for a successful transmision
    console.log("Text sent to FUNNODE!");
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```

Some more examples can be found in
[the repository](https://github.com/101100/xbee-promise/tree/master/examples).

## Planned future work

Future planned expansion of this module include:
- Adding command line tool to perform all three types of commands (for testing, etc).
- Translating inputs and outputs of commands logically.  E.g. ATNI command should
  return a string, not an array of character codes, ATD1 (and friends) should accept
  numeric values, and not require them to be in a byte array of the correct length.

