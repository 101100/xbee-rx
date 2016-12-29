/*jslint node:true */

/*
 * examples/simple-local.js
 * https://github.com/101100/xbee-rx
 *
 * Simple example showing the use of localCommand and the returned RX stream.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var xbeeRx = require("../lib/xbee-rx.js");

var xbee = xbeeRx({
    serialport: "/dev/ttyUSB0",
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

var command = (process.argv && process.argv[2]) || "MY";
var commandParameter = (process.argv && process.argv[3]) || [];

if (process.argv[4]) {
    console.error("Usage:");
    console.error(process.argv.slice(0, 2).join(" ") + " [<command>] [<command parameter>]");
    process.exit(1);
}

if (typeof commandParameter === "string" && !isNaN(parseInt(commandParameter, 10))) {
    var commandNumber = parseInt(commandParameter, 10);
    if (commandNumber < 0xff) {
        commandParameter = [ parseInt(commandParameter, 10) ];
    } else {
        commandParameter = [ (commandNumber >> 8) & 0xFF, commandNumber & 0xFF ];
    }
}

xbee
    .localCommand({
        command: command,
        commandParameter: commandParameter
    })
    .subscribe(function (resultBuffer) {
        var resultAsInt,
            resultAsString;

        console.log("Command successful!");

        if (resultBuffer) {
            if (resultBuffer.length === 0) {
                console.log("Result is empty");
            }
            resultAsString = resultBuffer.toString();
            if (resultAsString && !/[^\x20-\x7E]+/.test(resultAsString)) {
                console.log("Result as string:", resultAsString);
            }

            if (resultBuffer.length === 1) {
                resultAsInt = resultBuffer.readInt8(0);
            } else if (resultBuffer.length === 2) {
                resultAsInt = resultBuffer.readInt16BE(0);
            } else if (resultBuffer.length === 4) {
                resultAsInt = resultBuffer.readInt32BE(0);
            }
            if (typeof(resultAsInt) === "number") {
                console.log("Result as integer:", resultAsInt);
            }
        } else {
            console.log("No result buffer");
        }
    }, function (e) {
        console.log("Command failed:\n", e);
        xbee.close();
    }, function () {
        xbee.close();
    });
