/*jslint node:true */

/*
 * examples/blink.js
 * https://github.com/101100/xbee-rx
 *
 * Example that blinks a LED on AD1 on a remote module
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var xbeeRx = require('../lib/xbee-rx.js');
var rx = require("rx");
var R = require("ramda");


var xbee = xbeeRx({
    serialport: '/dev/ttyUSB0',
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

var nodeId = "TEMP3";

console.log('Blinking LED on AD1 on module with ID: ', nodeId);

// monitor CTRL-C to close serial connection
var stdin = process.stdin;
stdin.setRawMode(true);
var ctrlCStream = rx.Observable.fromEvent(stdin, 'data')
    .where(function monitorCtrlCOnData(data) {
        return data.length === 1 && data[0] === 0x03; // Ctrl+C
    })
    .take(1);

// stream that produces alternating true/false every 2 seconds
// (starting immediately)
var alternatingTrueFalse = rx.Observable.timer(0, 2000)
    .map(R.modulo(R.__, 2))
    .map(R.eq(0));

// stream indicating we're ready for the next blink (to prevent
// multiple commands "in the air" at the same time)
var readyStream = new rx.Subject();

rx.Observable.zip(alternatingTrueFalse, readyStream, R.identity)
    .takeUntil(ctrlCStream)
    .flatMap(function (onNext) {
        process.stdout.write("Turning LED " + (onNext ? "ON." : "OFF") + "...");

        return xbee.remoteCommand({
            command: "D1",
            commandParameter: [ onNext ? 5 : 4 ],
            destinationId: nodeId
        });
    })
    .subscribe(
        function () {
            console.log(" success.");
            readyStream.onNext(true);
        },
        function (err) {
            console.log(" command failed:\n", err);
            xbee.close();
            process.exit();
        },
        function () {
            console.log("All done!");
            xbee.close();
            process.exit();
        }
    );

// kick-start first LED command
readyStream.onNext(true);
