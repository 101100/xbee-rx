/*jslint node:true */

/*
 * examples/simple-remote.js
 * https://github.com/101100/xbee-rx
 *
 * Simple example showing the use of remoteCommand and the returned RX stream.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

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

var destinationId = process.argv && process.argv[2];
var command = (process.argv && process.argv[3]) || 'MY';
var commandParameter = (process.argv && process.argv[4]) || [];

if (!destinationId || process.argv[5]) {
    console.error('Usage:');
    console.error(process.argv.slice(0, 2).join(' ') + ' <destination ID> [<command>]');
    process.exit(1);
}

if (typeof commandParameter === "string" && !isNaN(parseInt(commandParameter, 10))) {
    commandParameter = [ parseInt(commandParameter, 10) ];
}

xbee
    .remoteCommand({
        command: command,
        commandParameter: commandParameter,
        destinationId: destinationId
    })
    .subscribe(function (f) {
        console.log("Command successful:\n", f);
    }, function (e) {
        console.log("Command failed:\n", e);
        xbee.close();
    }, function () {
        xbee.close();
    });

