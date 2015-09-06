/*jslint node:true */

/*
 * examples/simple-monitor.js
 * https://github.com/101100/xbee-rx
 *
 * Simple example showing how to monitor incoming transmissions and how
 * to clean up on CTRL-C.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var R = require("ramda");
var rx = require("rx");
var xbeeRx = require('../lib/xbee-rx.js');

var xbee = xbeeRx({
    serialport: '/dev/ttyUSB0',
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

console.log('Monitoring incoming packets (press CTRL-C to stop)');

// monitor CTRL-C to close serial connection
var stdin = process.stdin;
stdin.setRawMode(true);
var ctrlCStream = rx.Observable.fromEvent(stdin, 'data')
    .where(function monitorCtrlCOnData(data) {
        return data.length === 1 && data[0] === 0x03; // Ctrl+C
    })
    .take(1);

xbee
    .monitorTransmissions()
    .pluck("data")
    .map(function (buffer) {
        var s = buffer.toString();
        return s === '\r' ? '\n' : s;
    })
    .takeUntil(ctrlCStream)
    .subscribe(function (s) {
        process.stdout.write(s);
    }, function (error) {
        console.log("Error during monitoring:\n", error);
        xbee.close();
        process.exit();
    }, function () {
        console.log("\nGot CTRL-C; exiting.");
        xbee.close();
        process.exit();
    });

