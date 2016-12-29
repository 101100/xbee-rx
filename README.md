# xbee-rx
#### An XBee Reactive Extensions API

[![NPM version](https://badge.fury.io/js/xbee-rx.svg)](http://badge.fury.io/js/xbee-rx)
[![Travis CI Build Status](https://api.travis-ci.org/101100/xbee-rx.svg)](https://travis-ci.org/101100/xbee-rx)

The [xbee-rx](http://github.com/101100/xbee-rx/) [Node.js](http://nodejs.org/)
module wraps the [xbee-api](http://github.com/jouz/xbee-api/) module with a [reactive
extensions](https://github.com/Reactive-Extensions/RxJS)
API for [ZigBee](http://en.wikipedia.org/wiki/ZigBee) modules.  It may work with older
[802.15.4](http://en.wikipedia.org/wiki/IEEE_802.15.4) modules, but it has not been
tested with them.  Currently it facilitates local commands, remote commands, and remote
transmissions.  For remote commands and transmissions, either a address or node ID may be
provided, with automatic lookup and caching done for the node ID.

xbee-rx relies on
[serialport](https://github.com/voodootikigod/node-serialport) for serial communications.

## Usage

First, you will need to install the `xbee-rx` module (i.e.
`npm install xbee-rx` or `yarn add xbee-rx`).

### Initialization

To create a connection to your module, you will need to know the serial port that
it is connected to.  On Windows, this typically has the form `COMx`, where `x` is
a number.  On unix and OS X machines, this will typically be `/dev/tty???`, where
`???` can be anything from `USB0` to `.usbserial-A4013E5P`. In addition, you will
need to make sure that the module connected to your machine is in API mode and that
you know the baudrate it is set to.  By default, the baudrate is 57600 when API
mode is used.  In addition, you will need to know if you are using a ZigBee module,
a ZNet module or a 802.15.4 module.  These are sometimes referred to as series 2 for
ZigBee or series 1 for 802.15.4.  (Currently there are no differences in how this
library works between the ZigBee and ZNet modules.  Older series 2 modules have ZNet
firmware and can typically be upgraded to ZigBee firmware.)  Once these details are
known, you can initialize xbee-rx:

```javascript
var xbeeRx = require('xbee-rx');

var xbee = xbeeRx({
    serialport: '/dev/ttyUSB0',
    serialPortOptions: {
        baudrate: 57600
    },
    module: "ZigBee"
});
```

Note: if you are using API mode 2, you must specify that with the `api_mode` parameter
(`api_mode: 2`).  You can give any options
[known by serialport](https://github.com/voodootikigod/node-serialport#to-use) inside
`serialportOptions` (other than `parser` as it is used and set by xbee-rx).  To see
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
}).subscribe(function (response) {
    // response will be an array of two bytes, e.g. [ 23, 167 ]
    console.log("ATMY response:\n", response);
}, function (e) {
    console.log("Command failed:\n", e);
})
```


```javascript
xbee.localCommand({
    // ATD1 5
    // turn digital output 1 on
    command: "D1",
    commandParameter: [ 5 ]
}).subscribe(function (response) {
    // response will be [ 0 ] from the response frame
    console.log("Success!");
}, function (e) {
    console.log("Command failed:\n", e);
});
```

### Remote commands

Remote commands may be performed using the `remoteCommand` fuction.  They are similar
to local commands, but must have either a `destination64` 64 bit address, a
`destination16` 16 bit address, a `destinationId` node ID to indicate the target of
the command or the `broadcast` flag set to `true` to broadcast to all nodes.
`destinationId` is not supported by 802.15.4 modules.

Since there is support for broadcasting commands to multiple nodes, the entire frame is
included in the resulting stream.

```javascript
xbee.remoteCommand({
    // ATD0
    // get the status of digital pin 0
    command: "D0",
    // this ID must be set on the target node with ATNI
    destinationId: "FUNNODE"
}).subscribe(function (frame) {
    // frame will be a single value in an array, e.g. [ 1 ]
    console.log("ATD0 response from FUNNODE:\n", frame.commandData);
}, function (e) {
    console.log("Command failed:\n", e);
});
```


```javascript
xbee.remoteCommand({
    // ATD3
    // get the status of digital pin 3
    command: "D3",
    // destination addresses can be in hexidecimal or byte arrays
    destination16: [ 0xa9, 0x78 ]
}).subscribe(function (frame) {
    // frame will be a single value in an array, e.g. [ 1 ]
    console.log("ATD3 response from address A978:\n", frame.commandData);
}, function (e) {
    console.log("Command failed:\n", e);
});
```


```javascript
xbee.remoteCommand({
    // ATD1 4
    // Turn digital output 1 off
    command: "D1",
    commandParameter: [ 4 ],
    // destination addresses can be in hexidecimal or byte arrays
    // serial number from the bottom of the module (or combination of ATSH and ATSL)
    destination64: '0013a20040a099a1'
}).subscribe(function (frame) {
    // frame.commandData will be [ 0 ] from the response frame
    console.log("Success!");
}, function (e) {
    console.log("Command failed:\n", e);
});
```


```javascript
xbee.remoteCommand({
    // AT%V
    // Return current voltage
    command: "%V",
    // broadcast will be sent to all nodes in the network
    broadcast: true
}).subscribe(function (frame) {
    // response will be [ 0 ] from the response frame
    console.log("Got response from " + frame.remote16 + ": " + frame.commandData);
}, function (e) {
    console.log("Command transmission failed:\n", e);
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
}).subscribe(function (response) {
    // nothing should be emitted, so this can be ignored
}, function (e) {
    console.log("Command failed:\n", e);
}, function () {
    // successful completion of the stream indicates success
    console.log("Text sent to FUNNODE!");
});
```

### Monitoring incoming packets

You can subscribe to incoming packets in three ways.  You can monitor all incoming
packets by subscribing to `allPackets`.

```javascript
var subscription = xbee.allPackets
    .subscribe(function (packet) {
        // do something with the packet
    });
```

You can monitor incoming IO data sample packets by calling `monitorIODataPackets`.
That returns a stream of all packets filtered on the IO sample type.

```javascript
var subscription = xbee
    .monitorIODataPackets()
    .subscribe(function (ioSamplePacket) {
        // do something with the packet
        console.log("Analog sample from AD0:", ioSamplePacket.analogSamples.AD0);
    });
```

You can also monitor incoming transmission packets by calling `monitorTransmissions`.
That returns a stream of all packets filtered on the transmission type.

```javascript
var subscription = xbee
    .monitorTransmissions()
    .subscribe(function (transmissionPacket) {
        // do something with the packet
        console.log("Recieved remote transmission:", transmissionPacket.data);
    });
```

In all cases, the subscription should be cleaned up when you are done using it by
calling `dispose` on the subscription.

```javascript
subscription.dispose();
```

### Closing the connection

When you are done using the library, you should call the `close` method to clean up
the `xbee-rx` module as well as the contained serialport connection.

```javascript
xbee.close();
```

### A note about subscriptions

All of the commands must be subcribed to before they will activate.  For example,
the following code will have no effect.

```javascript
xbee.remoteTransmit({
    // this ID must be set on the target node with ATNI
    destinationId: "FUNNODE",
    data: "I'm sending you text, FUNNODE!"
});
```

Typically, you would want to subscribe to see if the command worked (was acknowledged
by the XBee module), so that you could print an error or try again.  If you don't
care about the result, you will still need to make a dummy subscription to trigger
the command, as in the following code.

```javascript
xbee.remoteTransmit({
    // this ID must be set on the target node with ATNI
    destinationId: "FUNNODE",
    data: "I'm sending you text, FUNNODE!"
}).subscribe(); // ignore status/result packet
```

### More examples

Some more examples can be found in
[the repository](https://github.com/101100/xbee-rx/tree/master/examples).

## Possible future work

Future possible expansion of this module include:
- Adding command line tool to perform all three types of commands (for testing, etc).
- Translating inputs and outputs of commands logically.  E.g. ATNI command should
  return a string, not an array of character codes, ATD1 (and friends) should accept
  numeric values, and not require them to be in a byte array of the correct length.

