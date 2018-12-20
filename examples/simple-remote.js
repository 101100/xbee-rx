/*jslint node:true */

/*
 * examples/simple-remote.js
 * https://github.com/101100/xbee-rx
 *
 * Simple example showing the use of remoteCommand and the returned RX stream.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var xbee_api = require("xbee-api");

var xbeeRx = require("../lib/xbee-rx.js");

var shared = require("./shared.js");


var xbee = xbeeRx({
    serialport: "/dev/ttyUSB0",
    serialportOptions: {
        baudRate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

var destinationId = process.argv && process.argv[2];
var command = (process.argv && process.argv[3]) || "MY";
var commandParameter = (process.argv && process.argv[4]) || [];

if (!destinationId || process.argv[5]) {
    console.error("Usage:");
    console.error(process.argv.slice(0, 2).join(" ") + " <destination ID or *> [<command>]");
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
    .remoteCommand({
        command: command,
        commandParameter: commandParameter,
        destinationId: destinationId !== "*" ? destinationId : undefined,
        broadcast: destinationId === "*"
    })
    .subscribe(function (result) {
        console.log("Got result from:", result.remote64);

        if (result.commandStatus === xbee_api.constants.COMMAND_STATUS.OK) {
            shared.printResult(result.commandData, "  ");
        } else {
            console.log("  Error: " + xbee_api.constants.COMMAND_STATUS[result.commandStatus]);
        }
    }, function (e) {
        console.log("Command could not be sent:\n", e);
        xbee.close();
    }, function () {
        xbee.close();
    });

