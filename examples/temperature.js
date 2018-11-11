/*jslint node:true */

/*
 * examples/temperature.js
 * https://github.com/101100/xbee-rx
 *
 * Example showing the use of monitorIODataPackets and some fun RxJS stream
 * manipulation.
 *
 * This requires that you have a node set up to send IO samples about once a second
 * and that a TMP36 is hooked up to the AD0 pin and included in the sample.  This
 * program will average 10 seconds of samples and print them if at least a minute
 * has gone by or the temperature changes.
 *
 * Copyright (c) 2015-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var moment = require("moment");

var rx = require("rxjs");
rx.operators = require("rxjs/operators");

var xbeeRx = require("../lib/xbee-rx.js");

function computeMean(samples) {
    if (samples.length === 0) {
        return 0;
    }

    return samples.reduce(function(a, b) { return a + b; }) / samples.length;
}

var xbee = xbeeRx({
    serialport: "/dev/ttyUSB0",
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

var lastValue;
var lastMoment;

var temperatureStream = xbee.monitorIODataPackets().pipe(
    rx.operators.pluck("analogSamples", "AD0"), // extract just the AD0 sample (in millivolts)
    rx.operators.map(function (mv) { return (mv - 500) / 10; }) // convert millivolts to Centigrade
);

var meanTemperatureStream = temperatureStream.pipe(
    rx.operators.buffer(function () { return rx.timer(60000); }), // collect 60 seconds of packets
    rx.operators.map(computeMean), // compute the mean of the collected samples
    rx.operators.map(function (value) { return Math.round(value * 10) / 10; }) // round to 1 decimal place
);

meanTemperatureStream.pipe(
    rx.operators.filter(function (value) {
        return value !== lastValue || moment().diff(lastMoment, "minutes") > 1;
    }),
    rx.operators.tap(function (value) {
        lastValue = value;
        lastMoment = moment();
    })
).subscribe(function (value) {
    console.log(new Date(), "temperature:", value);
}, function (error) {
    console.log("Error during monitoring:\n", error);
    xbee.close();
}, function () {
    console.log("Monitoring stream ended; exiting.");
    xbee.close();
});
