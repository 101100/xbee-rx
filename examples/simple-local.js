/*jslint node:true */

/*
 * simple-local.js
 * https://github.com/101100/xbee-promise
 *
 * Simple example showing the use of localCommand and the returned promise.
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
    debug: false
});

var command = (process.argv && process.argv[2]) || 'MY';
var commandParameter = (process.argv && process.argv[3]) || [];

if (process.argv[4]) {
    console.error('Usage:');
    console.error(process.argv.slice(0, 2).join(' ') + ' [<command>] [<command parameter>]');
    process.exit(1);
}

if (typeof commandParameter === "string" && !isNaN(parseInt(commandParameter, 10))) {
    commandParameter = [ parseInt(commandParameter, 10) ];
}

xbee.localCommand({
    command: command,
    commandParameter: commandParameter
}).then(function (f) {
    console.log("Command successful:\n", f);
}).catch(function (e) {
    console.log("Command failed:\n", e);
}).fin(function () {
    xbee.close();
});
