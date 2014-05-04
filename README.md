# xbee-promise

The [xbee-promise](http://github.com/101100/xbee-promise/) [Node.js](http://nodejs.org/)
module wraps the [xbee-api](http://github.com/jouz/xbee-api/) module with a promise-based
API for [ZigBee](http://en.wikipedia.org/wiki/ZigBee) modules.  It may work with older
[802.15.4](http://en.wikipedia.org/wiki/IEEE_802.15.4) modules, but it has not been
tested with them.  Currently it facilitates local commands, remote commands, and remote
transmissions.  For remote commands and transmissions, either a address or node ID may be
provided, with automatic lookup and aching done for the node ID.

[xbee-promise](http://github.com/101100/xbee-promise/) relies on
[serialport](https://github.com/voodootikigod/node-serialport) for serial communications.

## Getting Started
Install the module with: **[npm](https://npmjs.org/) install xbee-promise**

```javascript
var xbeePromise = require('../lib/xbee-promise.js');

var xbee = xbeePromise({
    serialport: '/dev/ttyUSB0',
    debug: true
});

xbee.remoteCommand({
    command: "MY",
    destinationId: "NODEID"
}).then(function (f) {
    console.log("Command successful:\n", f);
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
```

Other examples can be found in the [examples](https://github.com/101100/xbee-promise/tree/master/examples).

