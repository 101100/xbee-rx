/*jslint node:true */

/*
 * blink.js
 * https://github.com/101100/xbee-promise
 *
 * Example that blinks a LED on AD1 on a remote module
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var xbeePromise = require('../lib/xbee-promise.js');

var xbee = xbeePromise({
    serialport: '/dev/ttyUSB0',
    serialportOptions: {
        baudrate: 57600
    },
    // turn on debugging to see what the library is doing
    debug: false
});

var onNext = true;
var nodeId = "TEMP3";

console.log('Blinking LED on AD1 on module with ID: ', nodeId);

function toggleLed() {
    process.stdout.write("Turning LED " + (onNext ? "ON." : "OFF") + "...");

    xbee.remoteCommand({
        command: "D1",
        commandParameter: [ onNext ? 5 : 4 ],
        destinationId: nodeId
    }).then(function toggleSuccess() {
        console.log(" success.");
        onNext = !onNext;

        // schedule next toggle in 2 seconds
        setTimeout(toggleLed, 2000);
    }).catch(function toggleFailure(e) {
        console.log(" command failed:\n", e);
        xbee.close();
    });
}

// do initial toggle
setImmediate(toggleLed);
