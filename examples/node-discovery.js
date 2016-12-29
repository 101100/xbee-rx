/*jslint node:true */

/*
 * examples/node-discovery.js
 * https://github.com/101100/xbee-rx
 *
 * Example that performs node discovery.
 *
 * Copyright (c) 2015-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var R = require("ramda");
var rx = require("rx");
var xbee_api = require("xbee-api");
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

// we want to ignore the command stream result as well as any error (for no
// reply resulting from no found nodes)
var nodeDiscoveryCommandStream = xbee
    .localCommand({ command: "ND" })
    .catch(rx.Observable.empty())
    .ignoreElements();

var nodeDiscoveryRepliesStream = xbee
    .allPackets
    .where(R.propEq("type", xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE))
    .where(R.propEq("command", "ND"))
    .pluck("nodeIdentification");

xbee
    .localCommand({
        command: "NT",
    })
    .flatMap(function (ntResult) {
        // Fulfill promise when NT expires
        // NT is 1/10 seconds
        var timeoutMs = ntResult.readInt16BE(0) * 100;
        console.log("Got node discovery timeout:", timeoutMs, "ms");
        return nodeDiscoveryRepliesStream
            .takeUntil(rx.Observable.timer(timeoutMs + 1000))
            .merge(nodeDiscoveryCommandStream);
    })
    .subscribe(function (nodeIdentification) {
        console.log("Found node:\n", nodeIdentification);
    }, function (e) {
        console.log("Command failed:\n", e);
        xbee.close();
    }, function () {
        console.log("Timeout reached; done finding nodes");
        xbee.close();
    });

